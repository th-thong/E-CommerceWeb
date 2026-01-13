"use client"

import { useState, useEffect } from "react"
import { fetchSellerProducts } from "@/api/products"
import { fetchProductFeedbacks, createFeedbackReply } from "@/api/feedback"
import "../OrderManager/section.css"

const TOKEN_KEY = "auth_tokens"

const FeedbackManagement = () => {
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState("")
  const [submittingReply, setSubmittingReply] = useState(false)

  const getToken = () => {
    const saved = localStorage.getItem(TOKEN_KEY)
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

  // Lấy tất cả feedback của các sản phẩm trong shop
  const fetchAllFeedbacks = async () => {
    const token = getToken()
    if (!token) {
      setError("Vui lòng đăng nhập để sử dụng chức năng này.")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      // 1. Lấy danh sách sản phẩm của seller
      const products = await fetchSellerProducts(token)
      
      // 2. Với mỗi sản phẩm, lấy feedback
      const allFeedbacks = []
      for (const product of products) {
        try {
          const productFeedbacks = await fetchProductFeedbacks(product.product_id)
          // Thêm thông tin sản phẩm vào mỗi feedback
          const feedbacksWithProduct = productFeedbacks.map(fb => ({
            ...fb,
            product_id: product.product_id,
            product_name: product.product_name,
            product_image: product.images?.[0]?.image_url || null
          }))
          allFeedbacks.push(...feedbacksWithProduct)
        } catch (err) {
          console.error(`Error fetching feedbacks for product ${product.product_id}:`, err)
          // Tiếp tục với sản phẩm khác nếu có lỗi
        }
      }

      // Sắp xếp theo thời gian tạo (mới nhất trước)
      allFeedbacks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      
      setFeedbacks(allFeedbacks)
    } catch (err) {
      console.error("Error loading feedbacks:", err)
      setError(err.message || "Không thể tải danh sách đánh giá")
      setFeedbacks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllFeedbacks()
  }, [])

  // Xử lý phản hồi feedback
  const handleSubmitReply = async (feedback) => {
    if (!replyText.trim()) {
      alert("Vui lòng nhập nội dung phản hồi")
      return
    }

    const token = getToken()
    if (!token) {
      alert("Vui lòng đăng nhập lại")
      return
    }

    setSubmittingReply(true)
    try {
      await createFeedbackReply(
        feedback.product_id,
        feedback.id,
        { review: replyText.trim() },
        token
      )
      
      alert("Phản hồi đã được gửi thành công!")
      setReplyingTo(null)
      setReplyText("")
      // Reload feedbacks để hiển thị reply mới
      await fetchAllFeedbacks()
    } catch (err) {
      console.error("Error submitting reply:", err)
      alert("Lỗi: " + (err.message || "Không thể gửi phản hồi"))
    } finally {
      setSubmittingReply(false)
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
          <h2>Quản Lý Đánh Giá</h2>
          <span className="time-info">Xem và phản hồi đánh giá từ khách hàng</span>
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
          <h2>Quản Lý Đánh Giá</h2>
          <span className="time-info">Xem và phản hồi đánh giá từ khách hàng</span>
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
            onClick={fetchAllFeedbacks}
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
        <h2>Quản Lý Đánh Giá</h2>
        <span className="time-info">Xem và phản hồi đánh giá từ khách hàng</span>
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
              Chưa có đánh giá nào cho sản phẩm trong shop của bạn
            </p>
          </div>
        ) : (
          <div className="orders-list">
            {feedbacks.map((feedback) => (
              <div key={feedback.id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <span className="order-code">
                      {feedback.product_name || `Sản phẩm #${feedback.product_id}`}
                    </span>
                    <span className="order-date">
                      {formatDate(feedback.created_at)}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {feedback.product_image && (
                      <img
                        src={feedback.product_image}
                        alt={feedback.product_name}
                        style={{
                          width: 60,
                          height: 60,
                          objectFit: "cover",
                          borderRadius: 8,
                          border: "1px solid rgba(255, 255, 255, 0.1)"
                        }}
                      />
                    )}
                    <div>
                      {renderRating(feedback.rating)}
                    </div>
                  </div>
                </div>

                <div className="order-details">
                  <div className="customer-info">
                    <p>
                      <strong>Khách hàng:</strong> {feedback.user_name || `User #${feedback.user_id}`}
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

                  {/* Reply form */}
                  {replyingTo === feedback.id ? (
                    <div style={{ marginTop: 16, padding: 16, background: "rgba(255, 255, 255, 0.03)", borderRadius: 8 }}>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Nhập phản hồi của bạn..."
                        style={{
                          width: "100%",
                          minHeight: 100,
                          padding: 12,
                          background: "rgba(0, 0, 0, 0.3)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: 6,
                          color: "#fff",
                          fontSize: "14px",
                          fontFamily: "inherit",
                          resize: "vertical"
                        }}
                      />
                      <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
                        <button
                          onClick={() => {
                            setReplyingTo(null)
                            setReplyText("")
                          }}
                          style={{
                            padding: "8px 16px",
                            background: "rgba(255, 255, 255, 0.1)",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            borderRadius: 6,
                            color: "#fff",
                            cursor: "pointer"
                          }}
                          disabled={submittingReply}
                        >
                          Hủy
                        </button>
                        <button
                          onClick={() => handleSubmitReply(feedback)}
                          style={{
                            padding: "8px 16px",
                            background: "rgba(255, 94, 0, 0.8)",
                            border: "none",
                            borderRadius: 6,
                            color: "#fff",
                            cursor: submittingReply ? "not-allowed" : "pointer",
                            opacity: submittingReply ? 0.6 : 1
                          }}
                          disabled={submittingReply}
                        >
                          {submittingReply ? "Đang gửi..." : "Gửi phản hồi"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="order-footer">
                      <div className="order-actions">
                        <button
                          className="accept-btn"
                          onClick={() => setReplyingTo(feedback.id)}
                        >
                          Phản hồi
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FeedbackManagement
