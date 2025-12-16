import React, { useEffect, useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { fetchProducts } from "../services/api"
import ProductCardSkeleton from "./ProductCardSkeleton"
import "./product-catalog.css"

export default function ProductCatalog() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load TẤT CẢ products ngay từ đầu (không giới hạn)
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        // Load tất cả sản phẩm (không giới hạn)
        const result = await fetchProducts({ page: 1, limit: 1000 })
        setProducts(result.products)
      } catch (err) {
        if (err.message === "SERVER_ERROR") {
          setError("SERVER_ERROR")
        } else if (err.message === "NETWORK_ERROR") {
          setError("NETWORK_ERROR")
        } else {
          setError("UNKNOWN_ERROR")
        }
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  // Shuffle products để hiển thị ngẫu nhiên
  const shuffledProducts = useMemo(() => {
    if (!products.length) return []
    const list = [...products]
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[list[i], list[j]] = [list[j], list[i]]
    }
    return list
  }, [products])

  // Loading state - hiển thị skeleton cards
  if (loading) {
    return (
      <section className="catalog catalog--freeform">
        <div className="catalog__grid catalog__grid--freeform">
          {[...Array(6)].map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </section>
    )
  }

  // Error state
  if (error) {
    let errorMessage = "Đã xảy ra lỗi khi tải danh sách sản phẩm."
    
    if (error === "SERVER_ERROR") {
      errorMessage = "Máy chủ đang gặp sự cố. Vui lòng thử lại sau."
    } else if (error === "NETWORK_ERROR") {
      errorMessage = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet của bạn."
    }

    return (
      <section className="catalog catalog--freeform">
        <div className="catalog__error">
          <p>{errorMessage}</p>
          <button 
            type="button" 
            className="cta ghost"
            onClick={() => window.location.reload()}
          >
            Thử lại
          </button>
        </div>
      </section>
    )
  }

  // Empty state
  if (!shuffledProducts.length) {
    return (
      <section className="catalog catalog--freeform">
        <div className="catalog__empty">
          <p>Hiện chưa có sản phẩm nào.</p>
        </div>
      </section>
    )
  }

  // Success state - hiển thị TẤT CẢ products
  return (
    <section className="catalog catalog--freeform">
      {products.length > 0 && (
        <div className="catalog__info">
          <p className="catalog__count">
            Tổng cộng <strong>{products.length}</strong> sản phẩm
          </p>
        </div>
      )}
      
      <div className="catalog__grid catalog__grid--freeform">
        {shuffledProducts.map((product) => (
          <Link key={product.id} to={`/products/${product.id}`} className="catalog-card">
            <div className="catalog-card__media">
              <img src={product.heroImage || product.images?.[0]} alt={product.name} loading="lazy" />
              <span className="catalog-card__pill" style={{ borderColor: product.accent, color: product.accent }}>
                {product.categoryName}
              </span>
              <span className={`catalog-card__stock ${product.inStock ? "in-stock" : "out-stock"}`}>
                {product.inStock ? "Còn hàng" : "Hết hàng"}
              </span>
            </div>
            <div className="catalog-card__body">
              <h3>{product.name}</h3>
              <p>{product.summary}</p>
              <div className="catalog-card__meta">
                <span>{product.rating} ★</span>
                <span>{product.soldLabel} lượt mua</span>
              </div>
            </div>
            <div className="catalog-card__footer">
              <strong>{product.priceLabel}</strong>
              <span>Xem chi tiết ↗</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

