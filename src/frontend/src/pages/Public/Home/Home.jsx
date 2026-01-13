"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate, Link, useSearchParams } from "react-router-dom"
import { useCart } from "@/contexts/CartContext"
import { fetchTrendyProducts, fetchFlashSaleProducts, fetchPublicProducts, fetchRecommendProducts } from "@/api/products"
import { fetchCategories } from "@/api/categories"
import "./Home.css"

const TOKEN_KEY = "auth_tokens"

const HomePage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { addToCart } = useCart()
  const [trendyProducts, setTrendyProducts] = useState([])
  const [flashSaleProducts, setFlashSaleProducts] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [recommendProducts, setRecommendProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [filteredProducts, setFilteredProducts] = useState([])
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [showClearFilterMenu, setShowClearFilterMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const clearFilterMenuRef = useRef(null)

  // Đóng menu khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (clearFilterMenuRef.current && !clearFilterMenuRef.current.contains(event.target)) {
        setShowClearFilterMenu(false)
      }
    }

    if (showClearFilterMenu) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showClearFilterMenu])

  // Xử lý tìm kiếm từ URL params
  useEffect(() => {
    const query = searchParams.get('search')
    if (query) {
      setSearchQuery(query)
      setIsSearching(true)
    } else {
      setSearchQuery("")
      setIsSearching(false)
      setSearchResults([])
    }
  }, [searchParams])

  // Tìm kiếm sản phẩm
  useEffect(() => {
    if (searchQuery.trim() && allProducts.length > 0) {
      const query = searchQuery.toLowerCase().trim()
      const results = allProducts.filter(product => {
        const productName = (product.product_name || "").toLowerCase()
        const productDescription = (product.description || "").toLowerCase()
        // Tìm kiếm trong cả tên và mô tả
        return productName.includes(query) || productDescription.includes(query)
      })
      setSearchResults(results)
      console.log("Search query:", query, "Results:", results.length, results)
    } else if (!searchQuery.trim()) {
      setSearchResults([])
    }
  }, [searchQuery, allProducts])

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

  const filterProductsByCategory = (categoryId) => {
    // Lọc sản phẩm theo category
    let filtered = allProducts.filter(product => {
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
    
    // Áp dụng bộ lọc giá nếu có
    if (minPrice || maxPrice) {
      filtered = filterProductsByPrice(filtered)
    }
    
    return filtered
  }

  const filterProductsByPrice = (products) => {
    return products.filter(product => {
      // Tính giá hiển thị (có discount)
      const displayPrice = product.discount > 0 
        ? product.base_price * (1 - product.discount / 100)
        : product.base_price
      
      const price = Number.parseFloat(displayPrice) || 0
      const min = minPrice ? Number.parseFloat(minPrice) : 0
      const max = maxPrice ? Number.parseFloat(maxPrice) : Infinity
      
      return price >= min && price <= max
    })
  }

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId)
    const filtered = filterProductsByCategory(categoryId)
    setFilteredProducts(filtered)
    // Scroll đến phần sản phẩm đã lọc
    setTimeout(() => {
      const element = document.getElementById('filtered-products-section')
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  const handleApplyPriceFilter = () => {
    if (!selectedCategory) {
      alert("Vui lòng chọn danh mục trước khi lọc theo giá")
      return
    }
    
    // Validate input
    if (minPrice && maxPrice && Number.parseFloat(minPrice) > Number.parseFloat(maxPrice)) {
      alert("Giá tối thiểu không thể lớn hơn giá tối đa")
      return
    }
    
    // Lọc lại sản phẩm với bộ lọc giá mới
    const filtered = filterProductsByCategory(selectedCategory)
    setFilteredProducts(filtered)
  }

  const handleClearCategoryFilter = () => {
    setSelectedCategory(null)
    setFilteredProducts([])
    setMinPrice("")
    setMaxPrice("")
    setShowClearFilterMenu(false)
  }

  const handleClearPriceFilter = () => {
    setMinPrice("")
    setMaxPrice("")
    // Lọc lại sản phẩm chỉ theo category (không có bộ lọc giá)
    if (selectedCategory) {
      const filtered = allProducts.filter(product => {
        let productCategoryId = null
        
        if (typeof product.category === 'object' && product.category !== null) {
          productCategoryId = product.category.category_id || product.category.id
        } else if (typeof product.category === 'number') {
          productCategoryId = product.category
        } else if (typeof product.category === 'string') {
          productCategoryId = Number.parseInt(product.category)
        }
        
        return productCategoryId === selectedCategory || productCategoryId === Number.parseInt(selectedCategory)
      })
      setFilteredProducts(filtered)
    }
    setShowClearFilterMenu(false)
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

      {/* Kết quả tìm kiếm - hiển thị đầu tiên nếu đang tìm kiếm */}
      {isSearching && searchQuery && (
        <section className="promoted-section search-results-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "15px" }}>
            <h2>
              Kết quả tìm kiếm: "{searchQuery}" {searchResults.length > 0 && `(${searchResults.length} sản phẩm)`}
            </h2>
            <button 
              onClick={() => {
                navigate("/")
                setSearchQuery("")
                setIsSearching(false)
                setSearchResults([])
              }}
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
              Xóa tìm kiếm
            </button>
          </div>

          {searchResults.length > 0 ? (
            <div className="products-grid">
              {searchResults.map((product) => {
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
          ) : searchQuery && !loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "rgba(255, 255, 255, 0.7)" }}>
              <p>Không tìm thấy sản phẩm nào với từ khóa "{searchQuery}"</p>
            </div>
          ) : null}
        </section>
      )}

      {/* Chỉ hiển thị các section khác khi không đang tìm kiếm */}
      {!isSearching && (
        <>
          {/* Section 1: Sản phẩm Trendy (Bán Chạy) */}
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

      {/* Section 2: Flash Sale - Hiển thị ngay sau Trendy */}
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
        </>
      )}

      {!isSearching && categories.length > 0 && (
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

      {selectedCategory && (
        <section id="filtered-products-section" className="promoted-section filtered-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "15px" }}>
            <h2>
              Sản Phẩm: {categories.find(cat => cat.category_id === selectedCategory)?.category_name || "Danh mục"}
            </h2>
            <div style={{ position: "relative" }} ref={clearFilterMenuRef}>
              <button 
                onClick={() => setShowClearFilterMenu(!showClearFilterMenu)}
                style={{
                  padding: "8px 16px",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 94, 0, 0.3)",
                  borderRadius: "8px",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontFamily: "Rajdhani, sans-serif",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
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
                <span style={{ fontSize: "12px" }}>▼</span>
              </button>
              
              {showClearFilterMenu && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "8px",
                  background: "rgba(30, 30, 30, 0.95)",
                  border: "1px solid rgba(255, 94, 0, 0.3)",
                  borderRadius: "8px",
                  padding: "8px 0",
                  minWidth: "200px",
                  zIndex: 1000,
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)"
                }}>
                  <button
                    onClick={handleClearCategoryFilter}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      background: "transparent",
                      border: "none",
                      color: "#fff",
                      textAlign: "left",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontFamily: "Rajdhani, sans-serif",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "rgba(255, 94, 0, 0.2)"
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "transparent"
                    }}
                  >
                    Xóa bộ lọc danh mục
                  </button>
                  <div style={{
                    height: "1px",
                    background: "rgba(255, 94, 0, 0.2)",
                    margin: "4px 0"
                  }}></div>
                  <button
                    onClick={handleClearPriceFilter}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      background: "transparent",
                      border: "none",
                      color: "#fff",
                      textAlign: "left",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontFamily: "Rajdhani, sans-serif",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "rgba(255, 94, 0, 0.2)"
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "transparent"
                    }}
                  >
                    Xóa bộ lọc giá
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
            {/* Bộ lọc theo giá - bên trái */}
            <div style={{ 
              padding: "15px", 
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 94, 0, 0.2)",
              borderRadius: "12px",
              width: "220px",
              flexShrink: 0
            }}>
              <label style={{ 
                display: "block", 
                fontSize: "14px", 
                fontWeight: "600", 
                color: "#fff", 
                marginBottom: "12px",
                fontFamily: "Rajdhani, sans-serif"
              }}>
                Khoảng Giá
              </label>
              <div style={{ 
                display: "flex", 
                flexDirection: "column",
                gap: "8px",
                marginBottom: "12px"
              }}>
                <input
                  type="number"
                  placeholder="TỪ"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 94, 0, 0.3)",
                    borderRadius: "6px",
                    color: "#fff",
                    fontSize: "13px",
                    fontFamily: "Rajdhani, sans-serif"
                  }}
                  min="0"
                />
                <input
                  type="number"
                  placeholder="ĐẾN"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 94, 0, 0.3)",
                    borderRadius: "6px",
                    color: "#fff",
                    fontSize: "13px",
                    fontFamily: "Rajdhani, sans-serif"
                  }}
                  min="0"
                />
              </div>
              <button
                onClick={handleApplyPriceFilter}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "linear-gradient(45deg, #ff5e00, #ff9800)",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontFamily: "Rajdhani, sans-serif",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 15px rgba(255, 94, 0, 0.3)"
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)"
                  e.target.style.boxShadow = "0 6px 20px rgba(255, 94, 0, 0.4)"
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)"
                  e.target.style.boxShadow = "0 4px 15px rgba(255, 94, 0, 0.3)"
                }}
              >
                ÁP DỤNG
              </button>
            </div>

            {/* Danh sách sản phẩm - bên phải */}
            <div style={{ flex: 1 }}>
              {filteredProducts.length > 0 ? (
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
              ) : (
                <div style={{ textAlign: "center", padding: "40px", color: "rgba(255, 255, 255, 0.7)" }}>
                  <p>Không có sản phẩm nào phù hợp với bộ lọc.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}

export default HomePage



