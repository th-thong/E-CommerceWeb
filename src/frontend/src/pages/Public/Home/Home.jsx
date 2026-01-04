"use client"

import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useCart } from "@/contexts/CartContext"
import { fetchTrendyProducts, fetchFlashSaleProducts, fetchPublicProducts, fetchRecommendProducts } from "@/api/products"
import { fetchCategories } from "@/api/categories"
import "./Home.css"

const TOKEN_KEY = "auth_tokens"

const HomePage = () => {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [trendyProducts, setTrendyProducts] = useState([])
  const [flashSaleProducts, setFlashSaleProducts] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [recommendProducts, setRecommendProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [filteredProducts, setFilteredProducts] = useState([])
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

        // Tải song song tất cả các loại sản phẩm và danh mục
        const [trendyData, flashSaleData, allProductsData, recommendData, categoriesData] = await Promise.all([
          fetchTrendyProducts(accessToken),
          fetchFlashSaleProducts(accessToken),
          fetchPublicProducts(),
          fetchRecommendProducts(accessToken),
          fetchCategories(accessToken)
        ])

        setTrendyProducts(trendyData || [])
        setFlashSaleProducts(flashSaleData || [])
        setAllProducts(allProductsData || [])
        setRecommendProducts(recommendData || [])
        setCategories(categoriesData || [])
      } catch (err) {
        console.error("Error loading products:", err)
        setError(err.message || "Không thể tải sản phẩm")
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

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

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId)
    // Lọc sản phẩm theo category
    const filtered = allProducts.filter(product => {
      let productCategoryId = null
      
      if (typeof product.category === 'object' && product.category !== null) {
        productCategoryId = product.category.category_id || product.category.id
      } else if (typeof product.category === 'number') {
        productCategoryId = product.category
      } else if (typeof product.category === 'string') {
        productCategoryId = Number.parseInt(product.category)
      }
      
      return productCategoryId === categoryId || productCategoryId === Number.parseInt(categoryId)
    })
    setFilteredProducts(filtered)
    // Scroll đến phần sản phẩm đã lọc
    setTimeout(() => {
      const element = document.getElementById('filtered-products-section')
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  const handleClearFilter = () => {
    setSelectedCategory(null)
    setFilteredProducts([])
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

      {recommendProducts.length > 0 && (
        <section className="promoted-section recommend-section">
          <h2>💡 Gợi ý Sản Phẩm</h2>
          <div className="products-grid">
            {recommendProducts.map((product) => {
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

      {allProducts.length > 0 && (
        <section className="promoted-section all-products-section">
          <h2>🛍️ Tất Cả Sản Phẩm</h2>
          <div className="products-grid">
            {allProducts.map((product) => {
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

      {categories.length > 0 && (
        <section className="featured-categories">
          <h2>Danh Mục Nổi Bật</h2>
          <div className="categories-grid">
            {categories.map((category) => (
              <div 
                key={category.category_id} 
                className="category-card"
                onClick={() => handleCategoryClick(category.category_id)}
                style={{ cursor: "pointer" }}
              >
                <div className="category-icon">
                  <span style={{ fontSize: "48px" }}>📦</span>
                </div>
                <h3>{category.category_name}</h3>
                <p>Xem tất cả sản phẩm trong danh mục này</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {selectedCategory && filteredProducts.length > 0 && (
        <section id="filtered-products-section" className="promoted-section filtered-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
            <h2>
              Sản Phẩm: {categories.find(cat => cat.category_id === selectedCategory)?.category_name || "Danh mục"}
            </h2>
            <button 
              onClick={handleClearFilter}
              style={{
                padding: "8px 16px",
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 94, 0, 0.3)",
                borderRadius: "8px",
                color: "#fff",
                cursor: "pointer",
                fontSize: "14px",
                fontFamily: "Rajdhani, sans-serif",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(255, 94, 0, 0.2)"
                e.target.style.borderColor = "rgba(255, 94, 0, 0.5)"
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(255, 255, 255, 0.1)"
                e.target.style.borderColor = "rgba(255, 94, 0, 0.3)"
              }}
            >
              Xóa bộ lọc
            </button>
          </div>
          <div className="products-grid">
            {filteredProducts.map((product) => {
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

      {selectedCategory && filteredProducts.length === 0 && (
        <section id="filtered-products-section" className="promoted-section filtered-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
            <h2>
              Sản Phẩm: {categories.find(cat => cat.category_id === selectedCategory)?.category_name || "Danh mục"}
            </h2>
            <button 
              onClick={handleClearFilter}
              style={{
                padding: "8px 16px",
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 94, 0, 0.3)",
                borderRadius: "8px",
                color: "#fff",
                cursor: "pointer",
                fontSize: "14px",
                fontFamily: "Rajdhani, sans-serif"
              }}
            >
              Xóa bộ lọc
            </button>
          </div>
          <div style={{ textAlign: "center", padding: "40px", color: "rgba(255, 255, 255, 0.7)" }}>
            <p>Không có sản phẩm nào trong danh mục này.</p>
          </div>
        </section>
      )}
    </main>
  )
}

export default HomePage



