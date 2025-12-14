"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "./Home.css"

const HomePage = () => {
  const navigate = useNavigate()
  const [trendyProducts, setTrendyProducts] = useState([])
  const [flashSaleProducts, setFlashSaleProducts] = useState([])

  useEffect(() => {
    const promotedData = [
      {
        id: 1,
        name: "Áo thun nam casual",
        price: 150000,
        image: "/electronics-components.png",
        type: "trendy",
      },
      {
        id: 2,
        name: "Quần jean nam",
        price: 350000,
        image: "/diverse-fashion-collection.png",
        type: "trendy",
      },
      {
        id: 3,
        name: "Giày thể thao",
        price: 650000,
        originalPrice: 750000,
        discount: 15,
        image: "/cozy-cabin-interior.png",
        type: "flash_sale",
      },
    ]

    setTrendyProducts(promotedData.filter((p) => p.type === "trendy"))
    setFlashSaleProducts(promotedData.filter((p) => p.type === "flash_sale"))
  }, [])

  const handleNavigateToSeller = () => {
    navigate("/seller")
  }

  return (
    <main className="home-page">
      <section className="hero-banner">
        <h1>Chào mừng đến ShopLiteX</h1>
        <p>Nền tảng mua bán trực tuyến đến từ nhóm LOWKEY DUDES</p>
      </section>

      {trendyProducts.length > 0 && (
        <section className="promoted-section trendy-section">
          <h2>🔥 Sản Phẩm Trendy</h2>
          <div className="products-grid">
            {trendyProducts.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-image">
                  <img src={product.image || "/placeholder.svg"} alt={product.name} />
                </div>
                <div className="product-info">
                  <h4>{product.name}</h4>
                  <p className="product-price">{product.price.toLocaleString()}₫</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {flashSaleProducts.length > 0 && (
        <section className="promoted-section flash-sale-section">
          <h2>⚡ Flash Sale</h2>
          <div className="products-grid">
            {flashSaleProducts.map((product) => (
              <div key={product.id} className="product-card flash-sale-card">
                <div className="discount-badge">-{product.discount}%</div>
                <div className="product-image">
                  <img src={product.image || "/placeholder.svg"} alt={product.name} />
                </div>
                <div className="product-info">
                  <h4>{product.name}</h4>
                  <div className="price-section">
                    <p className="original-price">{product.originalPrice.toLocaleString()}₫</p>
                    <p className="sale-price">{product.price.toLocaleString()}₫</p>
                  </div>
                </div>
              </div>
            ))}
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
          <button className="cta-button" onClick={handleNavigateToSeller}>
            Đi Đến Kênh Người Bán
          </button>
        </div>
      </section>
    </main>
  )
}

export default HomePage



