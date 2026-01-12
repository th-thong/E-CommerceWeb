"use client"

import { useState, useEffect } from "react"
import { getAllFeedbacks, approveFeedback, banFeedback } from "@/api/admin"
import "../Seller/ProductManager/section.css"

const AdminContentModeration = () => {
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

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

  // Lấy danh sách tất cả feedbacks
  const fetchFeedbacks = async () => {
    const token = getToken()
    if (!token) {
      setError("Vui lòng đăng nhập với tài khoản Admin để sử dụng chức năng này.")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await getAllFeedbacks(token)
      setFeedbacks(data || [])
    } catch (err) {
      console.error("Error loading feedbacks:", err)
      if (err.message?.includes("401")) {
        setError("Bạn không có quyền truy cập. Vui lòng đăng nhập với tài khoản Admin.")
      } else {
        setError(err.message || "Không thể tải danh sách đánh giá")
      }
      setFeedbacks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedbacks()
  }, [])

  // Xử lý ẩn feedback
  const handleBanFeedback = async (feedbackId) => {
    if (!window.confirm("Bạn có chắc muốn ẩn đánh giá này?")) return
    
    setActionLoading(feedbackId)
    try {
      const token = getToken()
      await banFeedback(feedbackId, token)
      alert("Đã ẩn đánh giá thành công!")
      // Reload danh sách
      await fetchFeedbacks()
    } catch (err) {
      console.error("Error banning feedback:", err)
      alert("Lỗi: " + (err.message || "Không thể ẩn đánh giá"))
    } finally {
      setActionLoading(null)
    }
  }

  // Xử lý phục hồi feedback (bỏ ẩn)
  const handleApproveFeedback = async (feedbackId) => {
    if (!window.confirm("Bạn có chắc muốn phục hồi đánh giá này?")) return
    
    setActionLoading(feedbackId)
    try {
      const token = getToken()
      await approveFeedback(feedbackId, token)
      alert("Đã phục hồi đánh giá thành công!")
      // Reload danh sách
      await fetchFeedbacks()
    } catch (err) {
      console.error("Error approving feedback:", err)
      alert("Lỗi: " + (err.message || "Không thể phục hồi đánh giá"))
    } finally {
      setActionLoading(null)
    }
  }

  // Hiển thị rating bằng sao
  const renderRating = (rating) => {
    if (!rating) return <span style={{ color: "#888" }}>Chưa đánh giá</span>
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ color: i <= rating ? "#ffd700" : "#555", fontSize: "1.2em" }}>
          ★
        </span>
      )
    }
    return stars
  }

  // Format ngày giờ
  const formatDate = (dateString) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="section">
        <div className="section-header">
          <h2>Kiểm Duyệt Nội Dung</h2>
          <span className="time-info">Xem và quản lý đánh giá sản phẩm</span>
        </div>
        <div style={{ color: "#fff", padding: 40, textAlign: "center" }}>
          <p>Đang tải danh sách đánh giá...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="section">
        <div className="section-header">
          <h2>Kiểm Duyệt Nội Dung</h2>
          <span className="time-info">Xem và quản lý đánh giá sản phẩm</span>
        </div>
        <div style={{ 
          color: "#ff6b6b", 
          padding: 40, 
          textAlign: "center",
          background: "rgba(255, 107, 107, 0.1)",
          borderRadius: 8,
          border: "1px solid rgba(255, 107, 107, 0.3)"
        }}>
          <p>{error}</p>
          <button
            onClick={fetchFeedbacks}
            style={{
              marginTop: 16,
              padding: "10px 20px",
              background: "rgba(255, 107, 107, 0.2)",
              border: "1px solid rgba(255, 107, 107, 0.4)",
              borderRadius: 6,
              color: "#fff",
              cursor: "pointer"
            }}
          >
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="section">
      <div className="section-header">
        <h2>Kiểm Duyệt Nội Dung</h2>
        <span className="time-info">Xem và quản lý đánh giá sản phẩm</span>
      </div>

      <div style={{ marginTop: 24 }}>
        {feedbacks.length === 0 ? (
          <div style={{
            padding: 40,
            textAlign: "center",
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: 12,
            border: "1px solid rgba(255, 255, 255, 0.08)",
            color: "rgba(255, 255, 255, 0.6)"
          }}>
            <p style={{ fontSize: "16px", margin: 0 }}>
              Chưa có đánh giá nào trong hệ thống
            </p>
          </div>
        ) : (
          <div className="orders-list">
            {feedbacks.map((feedback) => (
              <div key={feedback.id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <span className="order-code">
                      Đánh giá #{feedback.id} - Sản phẩm: {feedback.product_name || `#${feedback.product_id}`}
                    </span>
                    <span className="order-date">
                      {formatDate(feedback.created_at)}
                    </span>
                  </div>
                  <span className={`status ${feedback.status === 'banned' ? 'rejected' : 'active'}`}>
                    {feedback.status === 'banned' ? 'Đã ẩn' : 'Hiển thị'}
                  </span>
                </div>

                <div className="order-details">
                  <div className="customer-info">
                    <p>
                      <strong>Người đánh giá:</strong> {feedback.user_name || `User #${feedback.user_id}`}
                    </p>
                    <p>
                      <strong>Điểm đánh giá:</strong> {renderRating(feedback.rating)}
                    </p>
                    <p>
                      <strong>Sản phẩm ID:</strong> {feedback.product_id}
                    </p>
                  </div>

                  <div className="order-items">
                    <strong>Nội dung đánh giá:</strong>
                    <p style={{ marginTop: 8, color: "rgba(255,255,255,0.85)", whiteSpace: "pre-wrap" }}>
                      {feedback.review}
                    </p>
                  </div>

                  {/* Replies */}
                  {feedback.items && feedback.items.length > 0 && (
                    <div style={{
                      marginTop: 16,
                      paddingLeft: 16,
                      borderLeft: "2px solid rgba(255, 255, 255, 0.1)"
                    }}>
                      <strong style={{ display: "block", marginBottom: 8 }}>Phản hồi:</strong>
                      {feedback.items.map((reply) => (
                        <div key={reply.id} style={{
                          marginBottom: 12,
                          paddingBottom: 12,
                          borderBottom: feedback.items.indexOf(reply) < feedback.items.length - 1
                            ? "1px solid rgba(255, 255, 255, 0.05)"
                            : "none"
                        }}>
                          <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 4
                          }}>
                            <span style={{ fontWeight: 500, fontSize: "0.95em" }}>
                              {reply.user_name}
                            </span>
                            <small style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "0.85em" }}>
                              {formatDate(reply.created_at)}
                            </small>
                          </div>
                          <p style={{
                            margin: 0,
                            fontSize: "0.9em",
                            color: "rgba(255, 255, 255, 0.8)",
                            lineHeight: 1.5
                          }}>
                            {reply.review}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="order-footer">
                    <div className="order-total">
                      <strong>Hành động:</strong>
                    </div>
                    <div className="order-actions">
                      {actionLoading === feedback.id ? (
                        <span style={{ color: "#aaa" }}>Đang xử lý...</span>
                      ) : feedback.status === 'banned' ? (
                        <button
                          className="accept-btn"
                          onClick={() => handleApproveFeedback(feedback.id)}
                        >
                          Bỏ ẩn (Phục hồi)
                        </button>
                      ) : (
                        <button
                          className="reject-btn"
                          onClick={() => handleBanFeedback(feedback.id)}
                        >
                          Ẩn đánh giá
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminContentModeration
