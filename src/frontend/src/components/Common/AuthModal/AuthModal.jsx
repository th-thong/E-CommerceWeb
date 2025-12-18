"use client"

import React, { useState, useEffect } from "react"
import "./AuthModal.css"
import { login, register } from "@/api/auth"

export default function AuthModal({ isOpen, onClose, initialMode = "login", onModeChange, onAuthSuccess }) {
  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [username, setUsername] = useState("")
  const [phone, setPhone] = useState("")
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
        setError("Chức năng đặt lại mật khẩu chưa hỗ trợ")
      }
    } catch (err) {
      const rawMsg = err?.message || ""
      const friendly =
        rawMsg.toLowerCase().includes("incorrect email or password") || rawMsg.toLowerCase().includes("incorrect email")
          ? "Sai email hoặc mật khẩu. Vui lòng nhập lại"
          : rawMsg || "Có lỗi xảy ra, vui lòng thử lại"
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
              : "Quên Mật Khẩu"}
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

          {mode !== "forgot-password" && (
            <div className="form-group">
              <label htmlFor="password">Mật khẩu</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}

          {mode === "signup" && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
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
              : "Gửi Liên Kết Reset"}
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
        </div>
      </div>
    </>
  )
}
