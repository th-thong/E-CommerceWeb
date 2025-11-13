"use client"

import React, { useState } from "react"
import "./navbar.css"
import AuthModal from "./auth-modal.jsx"

export default function Navbar() {
  const [authMode, setAuthMode] = useState(null)

  return (
    <>
      <header className="navbar">
        {/* Thanh trên */}
        <div className="navbar-top">
          <div className="navbar-links">
            <a href="#">Kênh Người Bán</a> |<a href="#">Trở thành Người bán ShopLiteX</a>
            <span className="social-icons">
              <i className="fab fa-facebook"></i>
              <i className="fab fa-instagram"></i>
            </span>
          </div>
        </div>

        {/* Thanh chính */}
        <div className="navbar-main">
          {/* Cụm trái: logo + tìm kiếm + giỏ hàng */}
          <div className="navbar-left">
            <div className="logo">
              <span className="logo-text">ShopLiteX</span>
            </div>

            <div className="search-bar">
              <input type="text" placeholder="Tìm kiếm sản phẩm..." />
              <button className="search-btn">🔍</button>
            </div>

            <button className="btn cart-btn">
              🛒 <span className="cart-count">0</span>
            </button>
          </div>

          {/* Cụm phải: đăng ký / đăng nhập */}
          <div className="navbar-right">
            <button className="btn" onClick={() => setAuthMode("signup")}>
              Đăng Ký
            </button>
            <button className="btn" onClick={() => setAuthMode("login")}>
              Đăng Nhập
            </button>
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={authMode !== null}
        onClose={() => setAuthMode(null)}
        initialMode={authMode || "login"}
        onModeChange={(newMode) => setAuthMode(newMode)}
      />
    </>
  )
}
