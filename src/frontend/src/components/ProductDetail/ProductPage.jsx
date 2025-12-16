import React, { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import ProductDetail from "./ProductDetail"
import ProductDetailSkeleton from "./ProductDetailSkeleton"
import { fetchProductById } from "../services/api"
import "./product-detail.css"

export default function ProductPage() {
  const { productId } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Reset state khi productId thay đổi
    setLoading(true)
    setError(null)
    setProduct(null)

    // Fetch product từ API
    const loadProduct = async () => {
      try {
        const data = await fetchProductById(productId)
        setProduct(data)
        setError(null)
      } catch (err) {
        if (err.message === "NOT_FOUND") {
          setError("NOT_FOUND")
        } else if (err.message === "SERVER_ERROR") {
          setError("SERVER_ERROR")
        } else if (err.message === "NETWORK_ERROR") {
          setError("NETWORK_ERROR")
        } else {
          setError("UNKNOWN_ERROR")
        }
        setProduct(null)
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      loadProduct()
    }
  }, [productId])

  // Loading state - hiển thị skeleton UI
  if (loading) {
    return (
      <div className="product-page">
        <Link to="/" className="product-detail__backlink">
          ← Quay lại bộ sưu tập
        </Link>
        <ProductDetailSkeleton />
      </div>
    )
  }

  // Error state - xử lý các loại lỗi
  if (error) {
    let errorMessage = "Đã xảy ra lỗi khi tải sản phẩm."
    let errorTitle = "Lỗi"

    if (error === "NOT_FOUND") {
      errorTitle = "Không tìm thấy sản phẩm"
      errorMessage = "Xin lỗi, sản phẩm bạn tìm không còn tồn tại."
    } else if (error === "SERVER_ERROR") {
      errorTitle = "Lỗi máy chủ"
      errorMessage = "Máy chủ đang gặp sự cố. Vui lòng thử lại sau."
    } else if (error === "NETWORK_ERROR") {
      errorTitle = "Lỗi kết nối"
      errorMessage = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet của bạn."
    }

    return (
      <div className="product-page product-page--empty">
        <h2>{errorTitle}</h2>
        <p>{errorMessage}</p>
        <Link to="/" className="cta ghost">
          Quay về danh sách
        </Link>
      </div>
    )
  }

  // Success state - hiển thị product detail
  if (!product) {
    return (
      <div className="product-page product-page--empty">
        <p>Xin lỗi, sản phẩm bạn tìm không còn tồn tại.</p>
        <Link to="/" className="cta ghost">
          Quay về danh sách
        </Link>
      </div>
    )
  }

  return (
    <div className="product-page">
      <Link to="/" className="product-detail__backlink">
        ← Quay lại bộ sưu tập
      </Link>
      <ProductDetail product={product} />
    </div>
  )
}

