import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useCart } from "@/contexts/CartContext"
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
  }, [product])

  if (!product) {
    return null
  }

  const clampQuantity = (value) => {
    const parsed = Number.parseInt(String(value), 10)
    if (Number.isNaN(parsed)) return 1
    return Math.min(99, Math.max(1, parsed))
  }

  const handleAddToCart = () => {
    if (!product || !product._originalData) return
    
    // Lấy dữ liệu gốc từ backend
    const originalProduct = product._originalData
    
    // Tìm variant phù hợp với selectedVariants (nếu có)
    let selectedVariant = null
    if (originalProduct.variants && originalProduct.variants.length > 0) {
      selectedVariant = originalProduct.variants[0] // Mặc định lấy variant đầu tiên
    }
    
    addToCart(originalProduct, selectedVariant, quantity)
    alert(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`)
  }

  const handleBuyNow = () => {
    if (!product || !product._originalData) return
    
    const originalProduct = product._originalData
    let selectedVariant = null
    if (originalProduct.variants && originalProduct.variants.length > 0) {
      selectedVariant = originalProduct.variants[0]
    }
    
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

  const hasDiscount =
    Number(product.discountPercent) > 0 &&
    !!product.originalPriceLabel &&
    product.originalPriceLabel !== product.priceLabel

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
            <strong>{product.priceLabel}</strong>
            {hasDiscount && <span className="product-detail__price-old">{product.originalPriceLabel}</span>}
            {hasDiscount && <span className="product-detail__badge">-{product.discountPercent}%</span>}
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

        <article className="panel">
          <h2>Đánh giá nổi bật</h2>
          <div className="panel__reviews">
            {product.reviews?.map((review) => (
              <div key={`${review.name}-${review.badge}`} className="review-card">
                <div className="review-card__header">
                  <span>{review.name}</span>
                  <small>{review.badge}</small>
                </div>
                <p>{review.comment}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}

