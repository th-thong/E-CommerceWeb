import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useCart } from "@/contexts/CartContext"
import { fetchProductFeedbacks, createProductFeedback } from "@/api/feedback"
import "./product-detail.css"

// Helper function để map tên màu sang hex color
function getColorValue(colorName) {
  const colorMap = {
    đen: "#1a1a1a",
    black: "#1a1a1a",
    trắng: "#ffffff",
    white: "#ffffff",
    kem: "#f5f5dc",
    cream: "#f5f5dc",
    be: "#f5f5dc",
    beige: "#f5f5dc",
    nâu: "#8b4513",
    brown: "#8b4513",
    đỏ: "#dc2626",
    red: "#dc2626",
    hồng: "#ff69b4",
    pink: "#ff69b4",
    cam: "#ff8c00",
    orange: "#ff8c00",
    vàng: "#ffd700",
    yellow: "#ffd700",
    tím: "#9370db",
    purple: "#9370db",
    "xanh ngọc": "#00ced1",
    "xanh dương": "#1e40af",
    blue: "#1e40af",
    navy: "#1e3a8a",
    "xanh lá": "#22c55e",
    green: "#22c55e",
    ghi: "#808080",
    xám: "#808080",
    gray: "#808080",
    grey: "#808080",
  }
  
  const normalized = colorName.toLowerCase().trim()
  return colorMap[normalized] || null
}

export default function ProductDetail({ product }) {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [selectedImage, setSelectedImage] = useState(product?.images?.[0] || "")
  const [selectedVariants, setSelectedVariants] = useState({})
  const [quantity, setQuantity] = useState(1)
  
  // Feedback states
  const [feedbacks, setFeedbacks] = useState([])
  const [feedbacksLoading, setFeedbacksLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState(null)
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, review: "" })
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  
  // Get token from localStorage
  const getToken = () => {
    const saved = localStorage.getItem("auth_tokens")
    if (!saved) return null
    try {
      const tokens = JSON.parse(saved)
      return tokens.accessToken || tokens.access || null
    } catch {
      return null
    }
  }

  // Check login status
  const checkLoginStatus = () => {
    const token = getToken()
    setIsLoggedIn(!!token)
    return token
  }

  // Check login status on mount and when storage changes
  useEffect(() => {
    // Check initial status
    checkLoginStatus()

    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'auth_tokens' || e.key === null) {
        checkLoginStatus()
      }
    }

    // Listen for custom auth change events (from Navbar when login in same tab)
    const handleAuthChange = () => {
      // Delay a bit to ensure localStorage is updated
      setTimeout(() => {
        checkLoginStatus()
      }, 100)
    }

    // Check when window gains focus (user comes back to tab)
    const handleFocus = () => {
      checkLoginStatus()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('authTokensChanged', handleAuthChange)
    window.addEventListener('focus', handleFocus)

    // Also check periodically (every 2 seconds) in case of sync issues
    const interval = setInterval(checkLoginStatus, 2000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('authTokensChanged', handleAuthChange)
      window.removeEventListener('focus', handleFocus)
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    setSelectedImage(product?.images?.[0] || "")
    setQuantity(1)
    // Khởi tạo selected variants với giá trị đầu tiên của mỗi variant
    if (product?.variants) {
      const initialVariants = {}
      product.variants.forEach((variant) => {
        if (variant.options && variant.options.length > 0) {
          initialVariants[variant.label] = variant.options[0]
        }
      })
      setSelectedVariants(initialVariants)
    }
    
    // Debug: log shop data
    if (product?.shop || product?._originalData?.shop) {
      console.log('Product shop data:', product.shop || product._originalData?.shop)
      console.log('Full product data:', product)
    }
  }, [product])

  // Load feedbacks when product changes
  useEffect(() => {
    const productId = product?._originalData?.product_id || product?.product_id
    if (!productId) return

    const loadFeedbacks = async () => {
      setFeedbacksLoading(true)
      setFeedbackError(null)
      try {
        const data = await fetchProductFeedbacks(productId)
        setFeedbacks(data || [])
      } catch (error) {
        console.error('Error loading feedbacks:', error)
        setFeedbackError('Không thể tải đánh giá')
        setFeedbacks([])
      } finally {
        setFeedbacksLoading(false)
      }
    }

    loadFeedbacks()
  }, [product])

  if (!product) {
    return null
  }

  const clampQuantity = (value) => {
    const parsed = Number.parseInt(String(value), 10)
    if (Number.isNaN(parsed)) return 1
    return Math.min(99, Math.max(1, parsed))
  }

  const getSelectedBackendVariant = () => {
    const originalProduct = product._originalData
    if (!originalProduct?.variants || originalProduct.variants.length === 0) {
      return null
    }

    // Nếu không có variant groups được hiển thị, trả về variant đầu tiên
    if (!product.variants || product.variants.length === 0) {
      return originalProduct.variants[0]
    }

    // Tìm variant trong backend khớp với TẤT CẢ các thuộc tính đã chọn
    const matchedVariant = originalProduct.variants.find((backendVariant) => {
      const backendAttrs = backendVariant.attributes || {}
      
      // Kiểm tra xem tất cả các variant groups đã chọn có khớp với backend variant không
      return product.variants.every((frontendVariantGroup) => {
        const selectedValue = selectedVariants[frontendVariantGroup.label]
        
        // Nếu không có giá trị nào được chọn cho variant group này, bỏ qua
        if (!selectedValue) {
          return true // Không cần khớp nếu chưa chọn
        }
        
        // Tìm key trong backend attributes tương ứng với frontend variant label
        // So sánh không phân biệt hoa thường và có thể khớp một phần
        const matchingKey = Object.keys(backendAttrs).find((backendKey) => {
          const backendKeyLower = backendKey.toLowerCase()
          const frontendLabelLower = frontendVariantGroup.label.toLowerCase()
          
          // Kiểm tra khớp trực tiếp hoặc khớp một phần
          return backendKeyLower === frontendLabelLower ||
                 backendKeyLower.includes(frontendLabelLower) ||
                 frontendLabelLower.includes(backendKeyLower) ||
                 // Kiểm tra các từ khóa thông dụng
                 (frontendLabelLower.includes('màu') && (backendKeyLower.includes('color') || backendKeyLower.includes('màu'))) ||
                 (frontendLabelLower.includes('color') && (backendKeyLower.includes('color') || backendKeyLower.includes('màu'))) ||
                 (frontendLabelLower.includes('dung lượng') && (backendKeyLower.includes('capacity') || backendKeyLower.includes('storage') || backendKeyLower.includes('dung'))) ||
                 (frontendLabelLower.includes('kích cỡ') && (backendKeyLower.includes('size') || backendKeyLower.includes('cỡ'))) ||
                 (frontendLabelLower.includes('loại') && (backendKeyLower.includes('type') || backendKeyLower.includes('loại')))
        })
        
        if (!matchingKey) {
          return false // Không tìm thấy key tương ứng
        }
        
        // So sánh giá trị (không phân biệt hoa thường và trim)
        const backendValue = String(backendAttrs[matchingKey] || '').trim().toLowerCase()
        const selectedValueNormalized = String(selectedValue).trim().toLowerCase()
        
        return backendValue === selectedValueNormalized
      })
    })

    // Trả về variant đã tìm thấy hoặc variant đầu tiên làm mặc định
    return matchedVariant || originalProduct.variants[0]
  }

  const handleAddToCart = () => {
    if (!product || !product._originalData) return
    
    const originalProduct = product._originalData
    const selectedVariant = getSelectedBackendVariant()

    addToCart(originalProduct, selectedVariant, quantity)
    alert(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`)
  }

  const handleBuyNow = () => {
    if (!product || !product._originalData) return
    
    const originalProduct = product._originalData
    const selectedVariant = getSelectedBackendVariant()
    
    addToCart(originalProduct, selectedVariant, quantity)
    navigate('/checkout')
  }

  const renderDetailDescription = () => {
    const desc = product.description?.trim()
    if (!desc) return null

    const lines = desc
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)

    const isNumberedList = lines.length > 0 && lines.every((line) => /^\d+\./.test(line))

    if (isNumberedList) {
      return (
        <ol className="panel__list">
          {lines.map((line) => (
            <li key={line}>{line.replace(/^\d+\.\s*/, "")}</li>
          ))}
        </ol>
      )
    }

    return <p className="panel__description">{desc}</p>
  }

  const renderDetailTagline = () => {
    const tagline = product.tagline?.trim()
    if (!tagline) return null

    const lines = tagline
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)

    const isNumberedList = lines.length > 0 && lines.every((line) => /^\d+\./.test(line))

    if (isNumberedList) {
      return (
        <ol className="panel__list">
          {lines.map((line) => (
            <li key={line}>{line.replace(/^\d+\.\s*/, "")}</li>
          ))}
        </ol>
      )
    }

    return <p className="panel__description">{tagline}</p>
  }

  const selectedBackendVariant = getSelectedBackendVariant()
  const basePriceNumber = selectedBackendVariant?.price ?? product.base_price
  const discountPercent = Number(product.discountPercent) || 0
  const hasDiscount = discountPercent > 0

  const priceNumber = Number(basePriceNumber) || 0
  const discountedPriceNumber = hasDiscount
    ? priceNumber * (1 - discountPercent / 100)
    : priceNumber

  const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value)

  const currentPriceLabel = formatCurrency(discountedPriceNumber)
  const originalPriceLabel = hasDiscount ? formatCurrency(priceNumber) : null

  // Handle feedback submission
  const handleSubmitFeedback = async (e) => {
    e.preventDefault()
    
    const token = checkLoginStatus()
    if (!token) {
      alert('Vui lòng đăng nhập để đánh giá sản phẩm')
      return
    }

    if (!feedbackForm.review.trim()) {
      alert('Vui lòng nhập nội dung đánh giá')
      return
    }

    const productId = product?._originalData?.product_id || product?.product_id
    if (!productId) return

    setSubmittingFeedback(true)
    try {
      await createProductFeedback(productId, {
        rating: feedbackForm.rating,
        review: feedbackForm.review.trim()
      }, token)
      
      // Reload feedbacks
      const data = await fetchProductFeedbacks(productId)
      setFeedbacks(data || [])
      
      // Reset form
      setFeedbackForm({ rating: 5, review: "" })
      setShowFeedbackForm(false)
      alert('Cảm ơn bạn! Đánh giá của bạn đã được gửi.')
    } catch (error) {
      console.error('Error submitting feedback:', error)
      const errorMessage = error.message || 'Không thể gửi đánh giá. Vui lòng thử lại.'
      alert(errorMessage)
    } finally {
      setSubmittingFeedback(false)
    }
  }

  // Render star rating
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < rating ? '#ffc107' : '#666', fontSize: '1.2em' }}>
        ★
      </span>
    ))
  }

  // Format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  return (
    <section id="product-detail" className="product-detail">
      <div className="product-detail__breadcrumbs">
        Trang chủ / {product.categoryName} / {product.name}
      </div>

      <div className="product-detail__grid">
        <div className="product-detail__media">
          <div className="product-detail__hero">
            <img src={selectedImage} alt={product.name} loading="lazy" />
          </div>

          <div className="product-detail__thumbnails">
            {product.images?.map((image, index) => (
              <button
                key={image}
                type="button"
                className={`product-detail__thumbnail ${selectedImage === image ? "is-active" : ""}`}
                onClick={() => setSelectedImage(image)}
                aria-label={`Xem ảnh ${index + 1}`}
              >
                <img src={image} alt={`${product.name} ${index + 1}`} loading="lazy" />
              </button>
            ))}
          </div>
        </div>

        <div className="product-detail__info">
          <div className="product-detail__eyebrow">{product.categoryName}</div>
          <h1>{product.name}</h1>

          <div className="product-detail__meta">
            <span className="product-detail__rating">
              ★ {product.rating} <span>({product.soldLabel} lượt mua)</span>
            </span>
            <span className="product-detail__shipping">{product.shipping}</span>
          </div>

          <div className="product-detail__pricing">
            <strong>{currentPriceLabel}</strong>
            {hasDiscount && <span className="product-detail__price-old">{originalPriceLabel}</span>}
            {hasDiscount && <span className="product-detail__badge">-{discountPercent}%</span>}
          </div>

          <div className={`product-detail__stock ${product.inStock ? "in-stock" : "out-stock"}`}>
            {product.stockLabel}
          </div>

          {!!product.variants?.length && (
            <div className="product-detail__variants">
              {product.variants.map((variant) => {
                const isColorVariant = variant.label.toLowerCase().includes("màu") || variant.label.toLowerCase().includes("color")
                const selectedValue = selectedVariants[variant.label] || variant.options[0]
                
                return (
                  <div key={variant.label} className="product-detail__variant">
                    <span>{variant.label}</span>
                    <div className={`product-detail__variant-options ${isColorVariant ? "product-detail__variant-options--color" : ""}`}>
                      {variant.options.map((option) => {
                        const isSelected = selectedValue === option
                        const colorValue = isColorVariant ? getColorValue(option) : null
                        const buttonStyle = colorValue ? { backgroundColor: colorValue } : {}
                        
                        // Kiểm tra nếu là màu trắng (để thêm class đặc biệt)
                        const isWhiteColor = isColorVariant && (
                          colorValue === "#ffffff" || 
                          colorValue === "#fff" ||
                          option.toLowerCase().includes('trắng') ||
                          option.toLowerCase().includes('white')
                        )
                        
                        return (
                          <button
                            key={option}
                            type="button"
                            className={`${isSelected ? "is-selected" : ""} ${isWhiteColor ? "is-white" : ""}`}
                            onClick={() => {
                              setSelectedVariants((prev) => ({
                                ...prev,
                                [variant.label]: option,
                              }))
                            }}
                            {...(isColorVariant && {
                              "data-color": option.toLowerCase(),
                              style: buttonStyle,
                            })}
                            title={isColorVariant ? option : undefined}
                          >
                            {!isColorVariant && option}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="product-detail__purchase">
            <div className="product-detail__quantity">
              <span>Số lượng</span>
              <div className="qty-stepper" role="group" aria-label="Chọn số lượng">
                <button
                  type="button"
                  className="qty-stepper__btn"
                  onClick={() => setQuantity((prev) => clampQuantity(prev - 1))}
                  disabled={!product.inStock || quantity <= 1}
                  aria-label="Giảm số lượng"
                >
                  −
                </button>
                <input
                  className="qty-stepper__input"
                  type="number"
                  min={1}
                  max={99}
                  value={quantity}
                  onChange={(e) => setQuantity(clampQuantity(e.target.value))}
                  disabled={!product.inStock}
                  aria-label="Số lượng"
                />
                <button
                  type="button"
                  className="qty-stepper__btn"
                  onClick={() => setQuantity((prev) => clampQuantity(prev + 1))}
                  disabled={!product.inStock || quantity >= 99}
                  aria-label="Tăng số lượng"
                >
                  +
                </button>
              </div>
            </div>

            <div className="product-detail__actions">
              <button 
                type="button" 
                className={`cta primary ${!product.inStock ? "is-disabled" : ""}`} 
                disabled={!product.inStock}
                onClick={handleAddToCart}
              >
                Thêm vào giỏ hàng
              </button>
              <button 
                type="button" 
                className={`cta ghost ${!product.inStock ? "is-disabled" : ""}`} 
                disabled={!product.inStock}
                onClick={handleBuyNow}
              >
                Mua ngay
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="product-detail__panels">
        <article className="panel">
          <h2>Thông tin chi tiết</h2>
          {renderDetailTagline()}
          {renderDetailDescription()}
          {!!product.specs?.length && (
            <dl>
              {product.specs.map((spec) => (
                <div key={spec.label} className="panel__spec">
                  <dt>{spec.label}</dt>
                  <dd>{spec.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </article>

        {/* Đánh giá sản phẩm */}
        <article className="panel">
          <h2>Đánh giá sản phẩm</h2>
          
          {/* Form đánh giá (chỉ hiện khi user đã đăng nhập) */}
          {isLoggedIn && !showFeedbackForm && (
            <div style={{ marginBottom: 24 }}>
              <button
                type="button"
                onClick={() => setShowFeedbackForm(true)}
                style={{
                  padding: '10px 20px',
                  background: 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '0.95em'
                }}
              >
                Viết đánh giá
              </button>
            </div>
          )}

          {showFeedbackForm && (
            <form onSubmit={handleSubmitFeedback} style={{
              marginBottom: 24,
              padding: 20,
              background: "rgba(255, 255, 255, 0.03)",
              borderRadius: 12,
              border: "1px solid rgba(255, 255, 255, 0.08)"
            }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                  Đánh giá của bạn: *
                </label>
                <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.5em',
                        color: star <= feedbackForm.rating ? '#ffc107' : '#666',
                        padding: 0
                      }}
                    >
                      ★
                    </button>
                  ))}
                  <span style={{ marginLeft: 8, color: 'rgba(255, 255, 255, 0.7)' }}>
                    ({feedbackForm.rating}/5)
                  </span>
                </div>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                  Nhận xét: *
                </label>
                <textarea
                  value={feedbackForm.review}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, review: e.target.value })}
                  placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                  required
                  rows={4}
                  style={{
                    width: '100%',
                    padding: 12,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 8,
                    color: 'white',
                    fontSize: '0.95em',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="submit"
                  disabled={submittingFeedback}
                  style={{
                    padding: '10px 24px',
                    background: submittingFeedback ? '#666' : 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: submittingFeedback ? 'not-allowed' : 'pointer',
                    fontSize: '0.95em',
                    fontWeight: 500
                  }}
                >
                  {submittingFeedback ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFeedbackForm(false)
                    setFeedbackForm({ rating: 5, review: "" })
                  }}
                  disabled={submittingFeedback}
                  style={{
                    padding: '10px 24px',
                    background: 'transparent',
                    color: 'rgba(255, 255, 255, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: 8,
                    cursor: submittingFeedback ? 'not-allowed' : 'pointer',
                    fontSize: '0.95em'
                  }}
                >
                  Hủy
                </button>
              </div>
            </form>
          )}

          {!isLoggedIn && (
            <div style={{
              padding: 16,
              marginBottom: 24,
              background: "rgba(255, 255, 255, 0.03)",
              borderRadius: 8,
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              <p style={{ margin: 0 }}>
                <button
                  type="button"
                  onClick={() => navigate('/?modal=auth&tab=login')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0
                  }}
                >
                  Đăng nhập
                </button>
                {' '}để viết đánh giá
              </p>
            </div>
          )}

          {/* Danh sách đánh giá */}
          <div className="panel__reviews">
            {feedbacksLoading && (
              <div style={{ padding: 20, textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)' }}>
                Đang tải đánh giá...
              </div>
            )}
            
            {feedbackError && (
              <div style={{ padding: 20, textAlign: 'center', color: '#ff6b6b' }}>
                {feedbackError}
              </div>
            )}
            
            {!feedbacksLoading && !feedbackError && feedbacks.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)' }}>
                Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá sản phẩm này!
              </div>
            )}
            
            {!feedbacksLoading && feedbacks.length > 0 && feedbacks.map((feedback) => (
              <div key={feedback.id} className="review-card" style={{
                marginBottom: 16,
                padding: 16,
                background: "rgba(255, 255, 255, 0.03)",
                borderRadius: 8,
                border: "1px solid rgba(255, 255, 255, 0.08)"
              }}>
                <div className="review-card__header" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 12
                }}>
                  <div>
                    <span style={{ fontWeight: 500, marginRight: 12 }}>{feedback.user_name}</span>
                    <div style={{ marginTop: 4 }}>
                      {renderStars(feedback.rating)}
                    </div>
                  </div>
                  <small style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.85em' }}>
                    {formatDate(feedback.created_at)}
                  </small>
                </div>
                <p style={{ margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {feedback.review}
                </p>
                
                {/* Replies */}
                {feedback.items && feedback.items.length > 0 && (
                  <div style={{
                    marginTop: 16,
                    paddingLeft: 16,
                    borderLeft: '2px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    {feedback.items.map((reply) => (
                      <div key={reply.id} style={{
                        marginBottom: 12,
                        paddingBottom: 12,
                        borderBottom: feedback.items.indexOf(reply) < feedback.items.length - 1 
                          ? '1px solid rgba(255, 255, 255, 0.05)' 
                          : 'none'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 4
                        }}>
                          <span style={{ fontWeight: 500, fontSize: '0.9em' }}>
                            {reply.user_name}
                          </span>
                          <small style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8em' }}>
                            {formatDate(reply.created_at)}
                          </small>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.9em', color: 'rgba(255, 255, 255, 0.8)' }}>
                          {reply.review}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </article>

        {/* Thông tin Shop */}
        {(() => {
          // Lấy shop từ product hoặc _originalData
          const shop = product.shop || product._originalData?.shop
          
          if (!shop) {
            // Nếu không có shop, không hiển thị section
            return null
          }
          
          // Xử lý trường hợp shop là ID (số) hoặc object
          if (typeof shop === 'number' || typeof shop === 'string') {
            // Shop chỉ là ID, không có thông tin chi tiết
            return null
          }
          
          // Lấy các thông tin shop
          const shopName = shop.shop_name || shop.name || shop.shopName
          const shopDescription = shop.description || shop.shop_description || shop.shopDescription
          const shopAddress = shop.shop_address || shop.address || shop.shopAddress
          const shopPhone = shop.shop_phone_number || shop.phone_number || shop.phone || shop.shopPhoneNumber
          const shopEmail = shop.shop_email || shop.email || shop.shopEmail
          
          const hasShopInfo = shopName || shopDescription || shopAddress || shopPhone || shopEmail
          
          if (!hasShopInfo) return null
          
          return (
            <article className="panel">
              <h2>Thông tin Shop</h2>
              <div style={{
                padding: 20,
                background: "rgba(255, 255, 255, 0.03)",
                borderRadius: 12,
                border: "1px solid rgba(255, 255, 255, 0.08)"
              }}>
                <div style={{ display: "grid", gap: 12 }}>
                  {shopName && (
                    <div>
                      <strong style={{ fontSize: "1.2em", color: "var(--accent)" }}>
                        {shopName}
                      </strong>
                    </div>
                  )}
                  {shopDescription && (
                    <div>
                      <p style={{ 
                        margin: 0, 
                        whiteSpace: "pre-wrap", 
                        lineHeight: 1.6,
                        color: "rgba(255, 255, 255, 0.8)"
                      }}>
                        {shopDescription}
                      </p>
                    </div>
                  )}
                  {(shopAddress || shopPhone || shopEmail) && (
                    <div style={{ 
                      display: "grid", 
                      gap: 8, 
                      marginTop: 8,
                      paddingTop: 16,
                      borderTop: "1px solid rgba(255, 255, 255, 0.1)"
                    }}>
                      {shopAddress && (
                        <div className="panel__spec">
                          <dt>Địa chỉ:</dt>
                          <dd>{shopAddress}</dd>
                        </div>
                      )}
                      {shopPhone && (
                        <div className="panel__spec">
                          <dt>Số điện thoại:</dt>
                          <dd>{shopPhone}</dd>
                        </div>
                      )}
                      {shopEmail && (
                        <div className="panel__spec">
                          <dt>Email:</dt>
                          <dd>{shopEmail}</dd>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </article>
          )
        })()}
      </div>
    </section>
  )
}

