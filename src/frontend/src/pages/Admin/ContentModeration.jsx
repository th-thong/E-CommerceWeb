"use client"

import { useState, useEffect } from "react"
import { getBannedFeedback, approveFeedback, getPendingProducts } from "@/api/admin"
import "../Seller/ProductManager/section.css"

const AdminContentModeration = () => {
  const [products, setProducts] = useState([])
  const [selectedProductId, setSelectedProductId] = useState("")
  const [bannedFeedbacks, setBannedFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
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

  // Lấy danh sách sản phẩm để chọn
  const fetchProducts = async () => {
    const token = getToken()
    if (!token) {
      setError("Vui lòng đăng nhập với tài khoản Admin để sử dụng chức năng này.")
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await getPendingProducts(token)
      setProducts(data || [])
    } catch (err) {
      console.error("Fetch products error:", err)
      if (err.message?.includes("401")) {
        setError("Bạn không có quyền truy cập. Vui lòng đăng nhập với tài khoản Admin.")
      } else {
        // Nếu không có sản phẩm chờ duyệt, vẫn cho phép nhập ID thủ công
        setProducts([])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // Lấy danh sách feedback bị cấm của sản phẩm đã chọn
  const fetchBannedFeedbacks = async (productId) => {
    if (!productId) {
      setBannedFeedbacks([])
      return
    }
    setFeedbackLoading(true)
    setError(null)
    try {
      const token = getToken()
      const data = await getBannedFeedback(productId, token)
      setBannedFeedbacks(data || [])
    } catch (err) {
      setError(err.message || "Không thể tải danh sách feedback")
      setBannedFeedbacks([])
    } finally {
      setFeedbackLoading(false)
    }
  }

  // Xử lý khi chọn sản phẩm
  const handleProductSelect = (e) => {
    const productId = e.target.value
    setSelectedProductId(productId)
    if (productId) {
      fetchBannedFeedbacks(productId)
    } else {
      setBannedFeedbacks([])
    }
  }

  // Xử lý tìm kiếm bằng ID thủ công
  const handleManualSearch = () => {
    const productId = document.getElementById("manual-product-id").value.trim()
    if (productId) {
      setSelectedProductId(productId)
      fetchBannedFeedbacks(productId)
    }
  }

  // Xử lý phê duyệt (phục hồi) feedback
  const handleApproveFeedback = async (feedbackId) => {
    if (!window.confirm("Bạn có chắc muốn phục hồi nội dung này?")) return
    setActionLoading(feedbackId)
    try {
      const token = getToken()
      await approveFeedback(feedbackId, token)
      alert("Đã phục hồi nội dung thành công!")
      // Refresh danh sách
      if (selectedProductId) {
        fetchBannedFeedbacks(selectedProductId)
      }
    } catch (err) {
      alert("Lỗi: " + (err.message || "Không thể phục hồi nội dung"))
    } finally {
      setActionLoading(null)
    }
  }

  // Hiển thị rating bằng sao
  const renderRating = (rating) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ color: i <= rating ? "#ffd700" : "#555" }}>
          ★
        </span>
      )
    }
    return stars
  }

  // Format ngày giờ
  const formatDate = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="section">
      <div className="section-header">
        <h2>Kiểm Duyệt Nội Dung</h2>
        <span className="time-info">Xem và phục hồi các đánh giá/bình luận bị ẩn</span>
      </div>

      {/* Chọn sản phẩm */}
      <div style={{ marginBottom: 20, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
        {/* Dropdown chọn từ danh sách sản phẩm */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label htmlFor="product-select" style={{ color: "#fff" }}>
            Chọn sản phẩm:
          </label>
          <select
            id="product-select"
            value={selectedProductId}
            onChange={handleProductSelect}
            style={{
              padding: "8px 12px",
              borderRadius: 4,
              border: "1px solid #444",
              backgroundColor: "#2a2a2a",
              color: "#fff",
              minWidth: 200,
            }}
          >
            <option value="">-- Chọn sản phẩm --</option>
            {products.map((product) => (
              <option key={product.product_id} value={product.product_id}>
                #{product.product_id} - {product.product_name}
              </option>
            ))}
          </select>
        </div>

        {/* Hoặc nhập ID thủ công */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#888" }}>hoặc</span>
          <input
            id="manual-product-id"
            type="text"
            placeholder="Nhập Product ID"
            style={{
              padding: "8px 12px",
              borderRadius: 4,
              border: "1px solid #444",
              backgroundColor: "#2a2a2a",
              color: "#fff",
              width: 120,
            }}
          />
          <button className="edit-btn" onClick={handleManualSearch}>
            Tìm kiếm
          </button>
        </div>
      </div>

      {loading && <p style={{ color: "#fff", padding: 20 }}>Đang tải danh sách sản phẩm...</p>}

      {/* Danh sách feedback bị cấm */}
      {selectedProductId && (
        <>
          {feedbackLoading ? (
            <p style={{ color: "#fff", padding: 20 }}>Đang tải feedback...</p>
          ) : error ? (
            <p style={{ color: "#ff6b6b", padding: 20 }}>{error}</p>
          ) : (
            <div className="orders-section">
              <h3 style={{ color: "#fff", marginBottom: 16 }}>
                Đánh giá bị ẩn của sản phẩm #{selectedProductId}
              </h3>

              {bannedFeedbacks.length === 0 ? (
                <p style={{ color: "#888", padding: 20 }}>
                  Không có đánh giá nào bị ẩn cho sản phẩm này
                </p>
              ) : (
                <div className="orders-list">
                  {bannedFeedbacks.map((feedback) => (
                    <div key={feedback.id} className="order-card">
                      <div className="order-header">
                        <div className="order-info">
                          <span className="order-code">
                            Đánh giá #{feedback.id}
                          </span>
                          <span className="order-date">
                            {formatDate(feedback.created_at)}
                          </span>
                        </div>
                        <span className="status rejected">Đã ẩn</span>
                      </div>

                      <div className="order-details">
                        <div className="customer-info">
                          <p>
                            <strong>Người đánh giá:</strong> {feedback.user_name || `User #${feedback.user_id}`}
                          </p>
                          <p>
                            <strong>Điểm đánh giá:</strong> {renderRating(feedback.rating)}
                          </p>
                        </div>

                        <div className="order-items">
                          <strong>Nội dung đánh giá:</strong>
                          <p style={{ marginTop: 8, color: "rgba(255,255,255,0.85)" }}>
                            {feedback.review}
                          </p>
                        </div>

                        <div className="order-footer">
                          <div className="order-total">
                            <strong>Hành động:</strong>
                          </div>
                          <div className="order-actions">
                            {actionLoading === feedback.id ? (
                              <span style={{ color: "#aaa" }}>Đang xử lý...</span>
                            ) : (
                              <button
                                className="accept-btn"
                                onClick={() => handleApproveFeedback(feedback.id)}
                              >
                                Phục hồi nội dung
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
          )}
        </>
      )}

      {/* Thông báo khi chưa chọn sản phẩm */}
      {!loading && !selectedProductId && (
        <div style={{ color: "#888", padding: 40, textAlign: "center" }}>
          <p>Vui lòng chọn sản phẩm để xem các đánh giá bị ẩn</p>
        </div>
      )}
    </div>
  )
}

export default AdminContentModeration
