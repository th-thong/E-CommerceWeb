import React, { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import ProductDetail from "./ProductDetail"
import ProductDetailSkeleton from "./ProductDetailSkeleton"
import { fetchPublicProductDetail } from "@/api/products"
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

    // Fetch product từ Django backend API
    const loadProduct = async () => {
      try {
        const data = await fetchPublicProductDetail(productId)
        
        // Transform data từ backend sang format component cần
        const transformedProduct = {
          id: data.product_id,
          product_id: data.product_id,
          name: data.product_name,
          product_name: data.product_name,
          description: data.description,
          base_price: data.base_price,
          priceLabel: new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
          }).format(data.base_price),
          discount: data.discount,
          discountPercent: data.discount,
          originalPriceLabel: data.discount > 0 ? new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
          }).format(data.base_price) : null,
          images: data.images?.map(img => img.image_url) || [],
          variants: data.variants?.map(v => ({
            label: "Loại",
            options: Object.values(v.attributes || {})
          })) || [],
          rating: data.average_rating || 0,
          soldLabel: `${data.total_sold || 0}`,
          inStock: true,
          stockLabel: "Còn hàng",
          categoryName: data.category?.name || "Sản phẩm",
          // Thêm dữ liệu gốc để có thể dùng cho giỏ hàng
          _originalData: data
        }
        
        setProduct(transformedProduct)
        setError(null)
      } catch (err) {
        console.error("Error loading product:", err)
        if (err.message?.includes("404") || err.message?.includes("not found")) {
          setError("NOT_FOUND")
        } else if (err.message?.includes("500")) {
          setError("SERVER_ERROR")
        } else if (err.message?.includes("network") || err.message?.includes("fetch")) {
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
          ← Quay lại trang chủ
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
        ← Quay lại trang chủ
      </Link>
      <ProductDetail product={product} />
    </div>
  )
}

