"use client"

import { useState, useEffect } from "react"
import { getPendingProducts, approveProduct } from "@/api/admin"
import "../Seller/ProductManager/section.css"

const AdminProductReview = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(null) // productId đang xử lý

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

  // Lấy danh sách sản phẩm chờ duyệt
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
      } else if (err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")) {
        setError("Không thể kết nối đến server. Vui lòng kiểm tra backend đã chạy chưa.")
      } else {
        setError(err.message || "Không thể tải danh sách sản phẩm.")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // Xử lý phê duyệt sản phẩm
  const handleApprove = async (productId) => {
    if (!window.confirm("Bạn có chắc muốn phê duyệt sản phẩm này?")) return
    setActionLoading(productId)
    try {
      const token = getToken()
      await approveProduct(productId, token)
      alert("Đã phê duyệt sản phẩm thành công!")
      fetchProducts()
    } catch (err) {
      alert("Lỗi: " + (err.message || "Không thể phê duyệt sản phẩm"))
    } finally {
      setActionLoading(null)
    }
  }

  // Format giá tiền
  const formatPrice = (price) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price
    return numPrice ? numPrice.toLocaleString() : "0"
  }

  // Lấy ảnh đầu tiên của sản phẩm
  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) {
      return product.images[0].image_url
    }
    return null
  }

  return (
    <div className="section">
      <div className="section-header">
        <h2>Duyệt Sản Phẩm Đăng Bán</h2>
        <span className="time-info">
          {products.length > 0 
            ? `${products.length} sản phẩm đang chờ phê duyệt` 
            : "Không có sản phẩm chờ duyệt"}
        </span>
      </div>

      {loading && <p style={{ color: "#fff", padding: 20 }}>Đang tải...</p>}
      {error && <p style={{ color: "#ff6b6b", padding: 20 }}>{error}</p>}

      {!loading && !error && (
        <div className="products-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Ảnh</th>
                <th>Tên sản phẩm</th>
                <th>Mô tả</th>
                <th>Giá gốc</th>
                <th>Giảm giá</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: 20 }}>
                    Không có sản phẩm nào chờ duyệt
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.product_id}>
                    <td>{product.product_id}</td>
                    <td>
                      {getProductImage(product) ? (
                        <img
                          src={getProductImage(product)}
                          alt={product.product_name}
                          style={{
                            width: 50,
                            height: 50,
                            objectFit: "cover",
                            borderRadius: 4,
                          }}
                        />
                      ) : (
                        <span style={{ color: "#888" }}>Không có ảnh</span>
                      )}
                    </td>
                    <td>{product.product_name}</td>
                    <td>
                      <span
                        title={product.description}
                        style={{
                          display: "block",
                          maxWidth: 150,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {product.description}
                      </span>
                    </td>
                    <td className="price">{formatPrice(product.base_price)}₫</td>
                    <td>
                      {product.discount > 0 ? (
                        <span style={{ color: "#ff6b6b" }}>-{product.discount}%</span>
                      ) : (
                        <span style={{ color: "#888" }}>0%</span>
                      )}
                    </td>
                    <td>
                      <span className="status pending">Chờ duyệt</span>
                    </td>
                    <td className="actions">
                      {actionLoading === product.product_id ? (
                        <span style={{ color: "#aaa" }}>Đang xử lý...</span>
                      ) : (
                        <button
                          className="accept-btn"
                          onClick={() => handleApprove(product.product_id)}
                        >
                          Phê duyệt
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminProductReview
