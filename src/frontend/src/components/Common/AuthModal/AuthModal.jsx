"use client"

import React, { useState, useEffect } from "react"
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
        await register({ user_name: username, email, password })
        setMessage("Đăng ký thành công, vui lòng đăng nhập")
        setMode("login")
      } else if (mode === "forgot-password") {
        const response = await forgotPassword({ email })
        // Backend trả về message trong response
        const message = response?.message || "Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra email."
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
    </>
  )
}
