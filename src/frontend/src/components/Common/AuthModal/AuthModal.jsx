"use client"

import React, { useState, useEffect, useRef } from "react"
import "./AuthModal.css"
import { login, register, forgotPassword, resetPassword } from "@/api/auth"

export default function AuthModal({ isOpen, onClose, initialMode = "login", onModeChange, onAuthSuccess }) {
  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [username, setUsername] = useState("")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [showTerms, setShowTerms] = useState(false)
  const [termsScrolled, setTermsScrolled] = useState(false)
  const termsRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      // Reset tất cả form data khi mở modal
      setMode(initialMode)
      setEmail("")
      setPassword("")
      setConfirmPassword("")
      setUsername("")
      setPhone("")
      setOtp("")
      setError(null)
      setMessage(null)
      setTermsScrolled(false)
    }
  }, [initialMode, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    try {
      setIsSubmitting(true)

      if (mode === "login") {
        const data = await login({ email, password })
        setMessage("Đăng nhập thành công")
        if (onAuthSuccess) onAuthSuccess(data)
        onClose?.()
      } else if (mode === "signup") {
        if (password !== confirmPassword) {
          setError("Mật khẩu không khớp")
          return
        }
        // Hiển thị điều khoản trước khi đăng ký
        setShowTerms(true)
        setIsSubmitting(false)
        return
      } else if (mode === "forgot-password") {
        const response = await forgotPassword({ email })
        // Backend trả về message trong response - chuyển sang tiếng Việt
        let message = response?.message || "Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra email."
        
        // Dịch message từ backend nếu là tiếng Anh
        if (message.includes("OTP code is being sent")) {
          message = "Mã OTP đang được gửi đến email của bạn. Vui lòng kiểm tra hộp thư đến (và thư mục spam)."
        } else if (message.includes("OTP code has been sent")) {
          message = "Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra email."
        } else if (message.includes("If email exists please check email")) {
          message = "Nếu email tồn tại, vui lòng kiểm tra email để nhận mã OTP."
        }
        
        setMessage(message)
        setMode("reset-password")
      } else if (mode === "reset-password") {
        if (!otp || otp.length !== 6) {
          setError("Vui lòng nhập mã OTP 6 số")
          return
        }
        if (password.length < 8) {
          setError("Mật khẩu phải có ít nhất 8 ký tự")
          return
        }
        if (password !== confirmPassword) {
          setError("Mật khẩu không khớp")
          return
        }
        const response = await resetPassword({ email, otp, new_password: password })
        const message = response?.message || "Đặt lại mật khẩu thành công! Vui lòng đăng nhập."
        setMessage(message)
        setTimeout(() => {
          setMode("login")
          setPassword("")
          setConfirmPassword("")
          setOtp("")
        }, 2000)
      }
    } catch (err) {
      const rawMsg = err?.message || ""
      let friendly = rawMsg || "Có lỗi xảy ra, vui lòng thử lại"
      
      // Xử lý các lỗi cụ thể
      if (rawMsg.toLowerCase().includes("banned")) {
        friendly = "Tài khoản của bạn đã bị khóa do vi phạm"
      } else if (rawMsg.toLowerCase().includes("incorrect email or password") || rawMsg.toLowerCase().includes("incorrect email")) {
        friendly = "Sai email hoặc mật khẩu. Vui lòng nhập lại"
      } else if (rawMsg.toLowerCase().includes("incorrect otp") || rawMsg.toLowerCase().includes("otp code has expired") || rawMsg.toLowerCase().includes("otp code")) {
        friendly = "Mã OTP không đúng hoặc đã hết hạn. Vui lòng thử lại"
      } else if (rawMsg.toLowerCase().includes("missing information") || rawMsg.toLowerCase().includes("missing info")) {
        friendly = "Vui lòng điền đầy đủ thông tin"
      } else if (rawMsg.toLowerCase().includes("user does not exist") || rawMsg.toLowerCase().includes("user not found")) {
        friendly = "Email không tồn tại trong hệ thống"
      } else if (rawMsg.toLowerCase().includes("error sending email")) {
        friendly = "Không thể gửi email. Vui lòng thử lại sau"
      } else if (rawMsg.toLowerCase().includes("please enter email")) {
        friendly = "Vui lòng nhập email"
      }
      
      setError(friendly)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleModeToggle = () => {
    const newMode = mode === "login" ? "signup" : "login"
    setMode(newMode)
    if (onModeChange) onModeChange(newMode)
  }

  const handleForgotPassword = () => setMode("forgot-password")
  const handleBackToLogin = () => setMode("login")

  // Khi người dùng đồng ý điều khoản, tiến hành đăng ký
  const handleAgreeTerms = async () => {
    try {
      setIsSubmitting(true)
      await register({ user_name: username, email, password, phone_number: phone })
      setMessage("Đăng ký thành công, vui lòng đăng nhập")
      setMode("login")
      setShowTerms(false)
    } catch (err) {
      const rawMsg = err?.message || ""
      setError(rawMsg || "Có lỗi xảy ra, vui lòng thử lại")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelTerms = () => {
    setShowTerms(false)
    setIsSubmitting(false)
    setTermsScrolled(false)
  }

  if (!isOpen) return null

  return (
    <>
      <div className="auth-backdrop" onClick={onClose} />

      <div className="auth-modal">
        <div className="modal-header">
          <h2>
            {mode === "login"
              ? "Đăng Nhập"
              : mode === "signup"
              ? "Tạo Tài Khoản"
              : mode === "forgot-password"
              ? "Quên Mật Khẩu"
              : "Đặt Lại Mật Khẩu"}
          </h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "signup" && (
            <div className="form-group">
              <label htmlFor="username">Tên người dùng</label>
              <input
                id="username"
                type="text"
                placeholder="Nhập tên người dùng"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={mode === "reset-password"}
            />
          </div>

          {mode === "signup" && (
            <div className="form-group">
              <label htmlFor="phone">Số điện thoại</label>
              <input
                id="phone"
                type="tel"
                placeholder="0901234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          )}

          {mode === "reset-password" && (
            <div className="form-group">
              <label htmlFor="otp">Mã OTP</label>
              <input
                id="otp"
                type="text"
                placeholder="Nhập mã OTP 6 số"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                maxLength={6}
              />
            </div>
          )}

          {(mode === "login" || mode === "signup" || mode === "reset-password") && (
            <div className="form-group">
              <label htmlFor="password">
                {mode === "reset-password" ? "Mật khẩu mới" : "Mật khẩu"}
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={mode === "reset-password" ? 8 : undefined}
              />
            </div>
          )}

          {(mode === "signup" || mode === "reset-password") && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={mode === "reset-password" ? 8 : undefined}
              />
            </div>
          )}

          {error && <p style={{ color: "#ff5e00", margin: 0 }}>{error}</p>}
          {message && <p style={{ color: "#00b2ff", margin: 0 }}>{message}</p>}

          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {mode === "login"
              ? "Đăng Nhập"
              : mode === "signup"
              ? "Đăng Ký"
              : mode === "forgot-password"
              ? "Gửi Mã OTP"
              : "Đặt Lại Mật Khẩu"}
          </button>
        </form>

        <div className="modal-footer">
          {mode === "login" && (
            <>
              <p>
                Chưa có tài khoản?
                <button type="button" className="toggle-mode" onClick={handleModeToggle}>
                  Đăng ký ngay
                </button>
              </p>
              <p>
                <button type="button" className="forgot-password-btn" onClick={handleForgotPassword}>
                  Quên mật khẩu?
                </button>
              </p>
            </>
          )}

          {mode === "signup" && (
            <p>
              Đã có tài khoản?
              <button type="button" className="toggle-mode" onClick={handleModeToggle}>
                Đăng nhập
              </button>
            </p>
          )}

          {mode === "forgot-password" && (
            <p>
              <button type="button" className="toggle-mode" onClick={handleBackToLogin}>
                Quay lại Đăng Nhập
              </button>
            </p>
          )}

          {mode === "reset-password" && (
            <p>
              <button type="button" className="toggle-mode" onClick={handleBackToLogin}>
                Quay lại Đăng Nhập
              </button>
            </p>
          )}
        </div>
      </div>

      {/* Modal Điều khoản & Chính sách */}
      {showTerms && (
        <div className="auth-backdrop" style={{ zIndex: 1200 }}>
          <div
            className="auth-modal"
            style={{
              maxWidth: 780,
              zIndex: 1201,
              borderRadius: 16,
              background: "linear-gradient(145deg, #0f172a, #111827)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
          >
            <div className="modal-header" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>ShopLiteX</p>
                <h2 style={{ margin: 0 }}>Điều khoản & Chính sách</h2>
              </div>
              <button className="close-btn" onClick={handleCancelTerms}>✕</button>
            </div>

            <div
              style={{
                maxHeight: "60vh",
                overflow: "auto",
                color: "#e5e7eb",
                lineHeight: 1.6,
                paddingRight: 8,
                display: "grid",
                gap: 16,
              }}
              ref={termsRef}
              onScroll={() => {
                const el = termsRef.current
                if (!el) return
                if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) {
                  setTermsScrolled(true)
                }
              }}
            >
              <section style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 style={{ margin: "0 0 8px 0", color: "#93c5fd" }}>ĐIỀU KHOẢN SỬ DỤNG</h3>
                <ul style={{ paddingLeft: 18, margin: 0, color: "#cbd5e1" }}>
                  <li>Người dùng cam kết cung cấp thông tin chính xác khi đăng ký và chịu trách nhiệm đối với mọi hoạt động phát sinh từ tài khoản của mình.</li>
                  <li>Nghiêm cấm việc sử dụng nền tảng cho các hành vi lừa đảo, đăng tải hàng hóa hoặc nội dung vi phạm pháp luật.</li>
                  <li>ShopLiteX có quyền tạm khóa, hạn chế hoặc chấm dứt tài khoản nếu phát hiện vi phạm Điều khoản sử dụng mà không cần báo trước.</li>
                </ul>
              </section>

              <section style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 style={{ margin: "0 0 8px 0", color: "#93c5fd" }}>CHÍNH SÁCH MUA BÁN & THANH TOÁN</h3>
                <ul style={{ paddingLeft: 18, margin: 0, color: "#cbd5e1" }}>
                  <li>Người mua có trách nhiệm thanh toán đầy đủ theo đơn hàng đã xác nhận.</li>
                  <li>Người bán chịu trách nhiệm về tính chính xác của thông tin sản phẩm, giá bán và việc giao hàng đúng cam kết.</li>
                  <li>ShopLiteX là nền tảng trung gian, không trực tiếp chịu trách nhiệm về chất lượng hàng hóa trừ trường hợp pháp luật quy định khác.</li>
                </ul>
              </section>

              <section style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 style={{ margin: "0 0 8px 0", color: "#93c5fd" }}>CHÍNH SÁCH BẢO MẬT THÔNG TIN</h3>
                <ul style={{ paddingLeft: 18, margin: 0, color: "#cbd5e1" }}>
                  <li>ShopLiteX thu thập và sử dụng dữ liệu cá nhân nhằm phục vụ giao dịch và nâng cao trải nghiệm người dùng.</li>
                  <li>Thông tin cá nhân được bảo mật và chỉ chia sẻ cho bên thứ ba liên quan (vận chuyển, thanh toán) hoặc theo yêu cầu của cơ quan có thẩm quyền.</li>
                </ul>
              </section>

              <section style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 style={{ margin: "0 0 8px 0", color: "#93c5fd" }}>HIỆU LỰC CHẤP THUẬN</h3>
                <ul style={{ paddingLeft: 18, margin: 0, color: "#cbd5e1" }}>
                  <li>Nhấn “Đồng ý tất cả” là chấp thuận tự nguyện và có giá trị pháp lý trong suốt quá trình sử dụng dịch vụ.</li>
                  <li>Nếu không đồng ý, người dùng cần ngừng sử dụng nền tảng.</li>
                </ul>
              </section>
            </div>

            <div className="modal-actions" style={{ marginTop: 16, display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button className="btn-cancel" onClick={handleCancelTerms} disabled={isSubmitting}>
                Không đồng ý
              </button>
              <button
                className="btn-save"
                onClick={handleAgreeTerms}
                disabled={isSubmitting || !termsScrolled}
                style={!termsScrolled ? { opacity: 0.6, cursor: "not-allowed" } : {}}
                title={!termsScrolled ? "Lướt xuống hết nội dung để đồng ý" : ""}
              >
                {isSubmitting ? "Đang xử lý..." : "Đồng ý tất cả"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
