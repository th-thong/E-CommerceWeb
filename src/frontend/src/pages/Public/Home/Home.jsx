"use client"

import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useCart } from "@/contexts/CartContext"
import { fetchTrendyProducts, fetchFlashSaleProducts } from "@/api/products"
import "./Home.css"

const TOKEN_KEY = "auth_tokens"

const HomePage = () => {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [trendyProducts, setTrendyProducts] = useState([])
  const [flashSaleProducts, setFlashSaleProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true)
        setError(null)

        // Lấy token nếu đã đăng nhập
        const savedTokens = localStorage.getItem(TOKEN_KEY)
        const tokens = savedTokens ? JSON.parse(savedTokens) : null
        const accessToken = tokens?.access || null

        // Tải song song cả trendy và flash sale
        const [trendyData, flashSaleData] = await Promise.all([
          fetchTrendyProducts(accessToken),
          fetchFlashSaleProducts(accessToken)
        ])

        setTrendyProducts(trendyData || [])
        setFlashSaleProducts(flashSaleData || [])
      } catch (err) {
        console.error("Error loading products:", err)
        setError(err.message || "Không thể tải sản phẩm")
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  const handleNavigateToSellerRegistration = () => {
    navigate("/seller-registration")
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price)
  }

  const formatSoldCount = (count) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count
  }

  if (loading) {
    return (
      <main className="home-page">
        <section className="hero-banner">
          <h1>Chào mừng đến ShopLiteX</h1>
          <p>Nền tảng mua bán trực tuyến đến từ nhóm LOWKEY DUDES</p>
        </section>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải sản phẩm...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="home-page">
        <section className="hero-banner">
          <h1>Chào mừng đến ShopLiteX</h1>
          <p>Nền tảng mua bán trực tuyến đến từ nhóm LOWKEY DUDES</p>
        </section>
        <div className="error-container">
          <p className="error-message">⚠️ {error}</p>
          <button className="cta-button" onClick={() => window.location.reload()}>
            Thử lại
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="home-page">
      <section className="hero-banner">
        <h1>Chào mừng đến ShopLiteX</h1>
        <p>Nền tảng mua bán trực tuyến đến từ nhóm LOWKEY DUDES</p>
      </section>

      {trendyProducts.length > 0 && (
        <section className="promoted-section trendy-section">
          <h2>🔥 Sản Phẩm Trendy (Bán Chạy)</h2>
          <div className="products-grid">
            {trendyProducts.map((product) => {
              const displayPrice = product.discount > 0 
                ? product.base_price * (1 - product.discount / 100)
                : product.base_price
              
              return (
                <Link 
                  key={product.product_id} 
                  to={`/product/${product.product_id}`} 
                  className="product-card-link"
                >
                  <div className="product-card">
                    <div className="product-image">
                      <img 
                        src={product.images?.[0]?.image_url || "/placeholder.svg"} 
                        alt={product.product_name}
                        onError={(e) => {
                          e.target.src = "/placeholder.svg"
                        }}
                      />
                      {product.discount > 0 && (
                        <div className="discount-badge">-{product.discount}%</div>
                      )}
                    </div>
                    <div className="product-info">
                      <h4>{product.product_name}</h4>
                      {product.discount > 0 ? (
                        <div className="price-section">
                          <p className="sale-price">{formatPrice(displayPrice)}</p>
                          <p className="original-price">{formatPrice(product.base_price)}</p>
                        </div>
                      ) : (
                        <p className="product-price">{formatPrice(product.base_price)}</p>
                      )}
                      <div className="product-stats">
                        <span className="rating">
                          ⭐ {product.average_rating || 0}
                        </span>
                        <span className="sold">
                          Đã bán {formatSoldCount(product.total_sold || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {flashSaleProducts.length > 0 && (
        <section className="promoted-section flash-sale-section">
          <h2>⚡ Flash Sale (Giảm Giá Sốc)</h2>
          <div className="products-grid">
            {flashSaleProducts.map((product) => {
              const salePrice = product.base_price * (1 - product.discount / 100)
              return (
                <Link 
                  key={product.product_id} 
                  to={`/product/${product.product_id}`}
                  className="product-card-link"
                >
                  <div className="product-card flash-sale-card">
                    <div className="discount-badge">-{product.discount}%</div>
                    <div className="product-image">
                      <img 
                        src={product.images?.[0]?.image_url || "/placeholder.svg"} 
                        alt={product.product_name}
                        onError={(e) => {
                          e.target.src = "/placeholder.svg"
                        }}
                      />
                    </div>
                    <div className="product-info">
                      <h4>{product.product_name}</h4>
                      <div className="price-section">
                        <p className="sale-price">{formatPrice(salePrice)}</p>
                        <p className="original-price">{formatPrice(product.base_price)}</p>
                      </div>
                      <div className="product-stats">
                        <span className="rating">
                          ⭐ {product.average_rating || 0}
                        </span>
                        <span className="sold">
                          Đã bán {formatSoldCount(product.total_sold || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <section className="featured-categories">
        <h2>Danh Mục Nổi Bật</h2>
        <div className="categories-grid">
          <div className="category-card">
            <img src="/electronics-components.png" alt="Điện tử" />
            <h3>Điện Tử</h3>
            <p>Các sản phẩm điện tử chất lượng cao</p>
          </div>
          <div className="category-card">
            <img src="/diverse-fashion-collection.png" alt="Thời trang" />
            <h3>Thời Trang</h3>
            <p>Trang phục và phụ kiện thời thượng</p>
          </div>
          <div className="category-card">
            <img src="/cozy-cabin-interior.png" alt="Nhà cửa" />
            <h3>Nhà Cửa</h3>
            <p>Đồ dùng gia đình và trang trí nhà</p>
          </div>
        </div>
      </section>

      <section className="seller-call-to-action">
        <div className="cta-content">
          <h2>Bạn Là Người Bán?</h2>
          <p>Tham gia ShopLiteX và phát triển kinh doanh của bạn với là khách hàng tiềm năng</p>
          <button className="cta-button" onClick={handleNavigateToSellerRegistration}>
            Trở thành người bán ShopLiteX
          </button>
        </div>
      </section>
    </main>
  )
}

export default HomePage



