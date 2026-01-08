"use client"

import { useState, useEffect } from "react"
import { getPendingProducts, approveProduct } from "@/api/admin"
import "../Seller/ProductManager/section.css"

const AdminProductReview = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(null) // productId đang xử lý
  const [detailProduct, setDetailProduct] = useState(null) // Sản phẩm đang xem chi tiết

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

  // Map attribute key sang label tiếng Việt
  const getAttributeLabel = (key, value) => {
    const keyLower = key.toLowerCase()
    const valueStr = String(value).trim()
    
    // Kiểm tra nếu là size
    const isSizeValue = (val) => {
      const valLower = val.toLowerCase()
      if (/^(xs|s|m|l|xl|xxl|xxxl)$/i.test(val)) return true
      if (/^\d+(xs|s|m|l|xl|xxl)$/i.test(val)) return true
      if (/^\d{2,3}$/.test(val)) return true
      return false
    }
    
    // Kiểm tra nếu là màu
    const isColorValue = (val) => {
      const valLower = val.toLowerCase()
      const colorKeywords = [
        'đen', 'trắng', 'đỏ', 'xanh', 'vàng', 'hồng', 'cam', 'tím', 'nâu', 
        'kem', 'be', 'ghi', 'xám', 'navy', 'black', 'white', 'red', 'blue', 
        'yellow', 'pink', 'orange', 'purple', 'brown', 'cream', 'beige', 
        'gray', 'grey', 'green'
      ]
      return colorKeywords.some(c => valLower.includes(c))
    }
    
    // Map key name
    if (keyLower.includes('size') || keyLower.includes('cỡ')) {
      return 'Size'
    }
    if (keyLower.includes('color') || keyLower.includes('màu')) {
      return 'Màu sắc'
    }
    
    // Nếu key là "type" hoặc "loại" và giá trị là size -> "Size"
    if ((keyLower === 'type' || keyLower === 'loại') && isSizeValue(valueStr)) {
      return 'Size'
    }
    
    // Nếu key là "type" hoặc "loại" và giá trị là màu -> "Màu sắc"
    if ((keyLower === 'type' || keyLower === 'loại') && isColorValue(valueStr)) {
      return 'Màu sắc'
    }
    
    // Map các key thông dụng khác
    const labelMap = {
      'type': 'Loại',
      'loại': 'Loại',
      'category': 'Loại',
      'capacity': 'Dung lượng',
      'storage': 'Dung lượng',
      'dung lượng': 'Dung lượng',
      'ram': 'RAM',
      'rom': 'ROM'
    }
    
    return labelMap[keyLower] || key
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
                        <>
                          <button
                            className="edit-btn"
                            onClick={() => setDetailProduct(product)}
                            style={{ marginRight: 8 }}
                          >
                            Xem chi tiết
                          </button>
                          <button
                            className="accept-btn"
                            onClick={() => handleApprove(product.product_id)}
                          >
                            Phê duyệt
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal xem chi tiết sản phẩm */}
      {detailProduct && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
          onClick={() => setDetailProduct(null)}
        >
          <div
            style={{
              background: "#111827",
              color: "#e5e7eb",
              padding: 24,
              borderRadius: 12,
              width: "90%",
              maxWidth: "800px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Chi tiết sản phẩm</h3>
              <button
                className="reject-btn"
                onClick={() => setDetailProduct(null)}
                style={{ backgroundColor: "#374151", padding: "8px 16px" }}
              >
                Đóng
              </button>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              {/* ID và Trạng thái */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div><strong>ID:</strong> {detailProduct.product_id}</div>
                <div><strong>Trạng thái:</strong> <span className="status pending">Chờ duyệt</span></div>
              </div>

              {/* Tên sản phẩm */}
              <div>
                <strong>Tên sản phẩm:</strong>
                <p style={{ margin: "8px 0 0 0", fontSize: "1.1em" }}>{detailProduct.product_name}</p>
              </div>

              {/* Hình ảnh */}
              {detailProduct.images && detailProduct.images.length > 0 && (
                <div>
                  <strong>Hình ảnh:</strong>
                  <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                    {detailProduct.images.map((img, index) => (
                      <img
                        key={index}
                        src={img.image_url}
                        alt={`${detailProduct.product_name} ${index + 1}`}
                        style={{
                          width: 100,
                          height: 100,
                          objectFit: "cover",
                          borderRadius: 8,
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Mô tả */}
              <div>
                <strong>Mô tả:</strong>
                <p style={{ margin: "8px 0 0 0", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                  {detailProduct.description || "—"}
                </p>
              </div>

              {/* Giá và Giảm giá */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <strong>Giá gốc:</strong> {formatPrice(detailProduct.base_price)}₫
                </div>
                <div>
                  <strong>Giảm giá:</strong>{" "}
                  {detailProduct.discount > 0 ? (
                    <span style={{ color: "#ff6b6b" }}>-{detailProduct.discount}%</span>
                  ) : (
                    <span style={{ color: "#888" }}>0%</span>
                  )}
                </div>
              </div>

              {/* Danh mục */}
              <div>
                <strong>Danh mục:</strong>{" "}
                {detailProduct.category?.name || detailProduct.category || "—"}
              </div>

              {/* Thông tin Shop */}
              {detailProduct.shop && (
                <div style={{
                  padding: 16,
                  background: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 8,
                  border: "1px solid rgba(255, 255, 255, 0.1)"
                }}>
                  <strong style={{ fontSize: "1.1em", marginBottom: 12, display: "block" }}>
                    Thông tin Shop
                  </strong>
                  <div style={{ display: "grid", gap: 8 }}>
                    <div>
                      <strong>Tên shop:</strong>{" "}
                      {detailProduct.shop.shop_name || detailProduct.shop.name || "—"}
                    </div>
                    {detailProduct.shop.shop_description && (
                      <div>
                        <strong>Mô tả shop:</strong>
                        <p style={{ margin: "8px 0 0 0", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                          {detailProduct.shop.shop_description}
                        </p>
                      </div>
                    )}
                    {detailProduct.shop.shop_address && (
                      <div>
                        <strong>Địa chỉ:</strong> {detailProduct.shop.shop_address}
                      </div>
                    )}
                    {detailProduct.shop.shop_phone_number && (
                      <div>
                        <strong>Số điện thoại:</strong> {detailProduct.shop.shop_phone_number}
                      </div>
                    )}
                    {detailProduct.shop.shop_email && (
                      <div>
                        <strong>Email:</strong> {detailProduct.shop.shop_email}
                      </div>
                    )}
                    {detailProduct.shop.owner && (
                      <div>
                        <strong>Chủ shop:</strong>{" "}
                        {detailProduct.shop.owner.user_name || 
                         detailProduct.shop.owner.username || 
                         detailProduct.shop.owner.email || 
                         "—"}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Variants */}
              {detailProduct.variants && detailProduct.variants.length > 0 && (
                <div>
                  <strong>Biến thể sản phẩm:</strong>
                  <div style={{ marginTop: 8 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                          <th style={{ padding: "8px", textAlign: "left" }}>Giá</th>
                          <th style={{ padding: "8px", textAlign: "left" }}>Số lượng</th>
                          <th style={{ padding: "8px", textAlign: "left" }}>Thuộc tính</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailProduct.variants.map((variant, index) => (
                          <tr key={index} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <td style={{ padding: "8px" }}>{formatPrice(variant.price)}₫</td>
                            <td style={{ padding: "8px" }}>{variant.quantity}</td>
                            <td style={{ padding: "8px" }}>
                              {variant.attributes && Object.keys(variant.attributes).length > 0 ? (
                                <div>
                                  {Object.entries(variant.attributes).map(([key, value]) => (
                                    <div key={key} style={{ fontSize: "0.9em" }}>
                                      <strong>{getAttributeLabel(key, value)}:</strong> {String(value)}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span style={{ color: "#888" }}>—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminProductReview
