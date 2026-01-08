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
    
    // Debug: log shop data
    if (product?.shop || product?._originalData?.shop) {
      console.log('Product shop data:', product.shop || product._originalData?.shop)
      console.log('Full product data:', product)
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

