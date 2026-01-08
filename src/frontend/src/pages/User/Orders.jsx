"use client"

import { useState, useEffect } from "react"
import { getOrderHistory } from "@/api/orders"
import BackgroundAnimation from "@/components/Common/BackgroundAnimation/BackgroundAnimation"
import Navbar from "@/components/Layout/Navbar/Navbar"
import "./User.css"

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const getToken = () => {
    const saved = localStorage.getItem("auth_tokens")
    if (saved) {
      try {
        const tokens = JSON.parse(saved)
        return tokens.access
      } catch {
        return null
      }
    }
    return null
  }

  useEffect(() => {
    const fetchOrders = async () => {
      const token = getToken()
      if (!token) {
        setError("Vui lòng đăng nhập để xem đơn hàng")
        setLoading(false)
        return
      }
      try {
        const response = await getOrderHistory(token)
        // Backend có thể trả về array trực tiếp hoặc object với data field
        if (Array.isArray(response)) {
          setOrders(response)
        } else if (response?.data) {
          setOrders(response.data)
        } else {
          setOrders([])
        }
      } catch (err) {
        console.error("Error fetching orders:", err)
        if (err.message?.includes("404") || err.message?.includes("401")) {
          setOrders([])
          setError(null) // Không hiển thị lỗi nếu chỉ là chưa đăng nhập hoặc không có đơn hàng
        } else {
          setError(err.message || "Không thể tải đơn hàng")
        }
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit", 
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const formatPrice = (price) => {
    return Number(price).toLocaleString() + "₫"
  }

  const getStatusLabel = (status) => {
    switch(status) {
      case "pending": return "Chờ xử lý"
      case "confirmed": return "Đã xác nhận"
      case "shipped": return "Đang giao"
      case "paid": return "Đã thanh toán"
      default: return status
    }
  }

  return (
    <div className="container">
      <BackgroundAnimation />
      <Navbar />
      <div className="user-page">
        <div className="user-content">
          <h1>Đơn Mua Của Tôi</h1>
          
          {loading && <p className="loading">Đang tải...</p>}
          {error && <p className="error">{error}</p>}
          
          {!loading && !error && (
            <>
              {orders.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📦</span>
                  <p>Bạn chưa có đơn hàng nào</p>
                </div>
              ) : (
                <div className="orders-list">
                  {orders.map((order) => (
                    <div key={order.id} className="order-card">
                      <div className="order-header">
                        <span className="order-id">Đơn hàng #{order.id}</span>
                        <span className="order-date">{formatDate(order.created_at)}</span>
                      </div>
                      
                      <div className="order-items">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="order-item">
                            {item.product_image && (
                              <img src={item.product_image} alt={item.product_name} className="item-image" />
                            )}
                            <div className="item-info">
                              <span className="item-name">{item.product_name}</span>
                              {item.variant && (
                                <span className="item-variant">
                                  {typeof item.variant === 'object' 
                                    ? Object.entries(item.variant)
                                        .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '')
                                        .map(([key, value]) => `${key}: ${value}`)
                                        .join(', ')
                                    : item.variant
                                  }
                                </span>
                              )}
                              <span className="item-qty">x{item.quantity}</span>
                            </div>
                            <span className="item-price">{formatPrice(item.price)}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="order-footer">
                        <div className="order-status">
                          <span className={`status-badge ${order.order_status}`}>
                            {getStatusLabel(order.order_status)}
                          </span>
                          {order.payment_method && order.payment_method !== "Unknown" && (
                            <span className={`status-badge ${order.payment_method?.toLowerCase()}`}>
                              {order.payment_method}
                            </span>
                          )}
                        </div>
                        <div className="order-total">
                          Tổng: <strong>{formatPrice(order.total_price)}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Orders


