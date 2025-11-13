"use client"

import React, { useState, useEffect } from "react"
import "./auth-modal.css"

export default function AuthModal({ isOpen, onClose, initialMode = "login", onModeChange }) {
  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [username, setUsername] = useState("")
  const [phone, setPhone] = useState("")

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("Form submitted:", { email, password, username, phone, mode })
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
                required
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

          <button type="submit" className="submit-btn">
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
