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

  // Tự động scroll về đầu trang khi vào trang chi tiết sản phẩm
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [productId])

  useEffect(() => {
    // Reset state khi productId thay đổi
    setLoading(true)
    setError(null)
    setProduct(null)

    // Fetch product từ Django backend API
    const loadProduct = async () => {
      try {
        const data = await fetchPublicProductDetail(productId)

        // --- Transform data từ backend sang format component cần ---
        // 1. Tách "Màu sắc" và "Loại" thành 2 variant groups riêng biệt
        let transformedVariants = []

        if (Array.isArray(data.variants) && data.variants.length > 0) {
          // Thu thập tất cả giá trị màu sắc duy nhất
          const colorSet = new Set()
          const typeSet = new Set()
          
          data.variants.forEach((v) => {
            const attrs = v.attributes || {}
            if (attrs.color) {
              colorSet.add(String(attrs.color).trim())
            }
            if (attrs.type) {
              typeSet.add(String(attrs.type).trim())
            }
          })

          // Tạo variant group "Màu sắc" nếu có
          if (colorSet.size > 0) {
            transformedVariants.push({
              label: "Màu sắc",
              options: Array.from(colorSet).sort(),
            })
          }

          // Tạo variant group "Loại" nếu có
          if (typeSet.size > 0) {
            transformedVariants.push({
              label: "Loại",
              options: Array.from(typeSet).sort(),
            })
          }
          
          // Nếu không có color hoặc type, nhưng có attributes khác, hiển thị tất cả
          if (transformedVariants.length === 0) {
            const allAttrKeys = new Set()
            data.variants.forEach((v) => {
              const attrs = v.attributes || {}
              Object.keys(attrs).forEach(key => allAttrKeys.add(key))
            })

            allAttrKeys.forEach(key => {
              const valueSet = new Set()
              data.variants.forEach((v) => {
                const attrs = v.attributes || {}
                const value = attrs[key]
                if (value !== null && value !== undefined && value !== "") {
                  valueSet.add(String(value).trim())
                }
              })
              
              if (valueSet.size > 0) {
                let label = String(key).trim()
                // Chuẩn hóa label
                const keyLower = label.toLowerCase()
                if (["màu", "mau", "màu sắc", "color", "colour"].includes(keyLower)) {
                  label = "Màu sắc"
                } else if (["size", "kích cỡ", "kich co", "cỡ", "co"].includes(keyLower)) {
                  label = "Kích cỡ"
                }
                
                transformedVariants.push({
                  label,
                  options: Array.from(valueSet).sort(),
                })
              }
            })
          }
        }

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
          // Tách riêng Size, Color và các Loại khác từ variants (tự động nhận diện dựa trên giá trị)
          variants: (() => {
            if (!data.variants || data.variants.length === 0) return []
            
            // Map để lưu tất cả các attribute keys và giá trị của chúng
            const attributeMap = new Map() // key -> Set of values
            
            // Thu thập tất cả attributes từ tất cả variants
            data.variants.forEach(v => {
              const attrs = v.attributes || {}
              Object.entries(attrs).forEach(([key, value]) => {
                if (!key || value === null || value === undefined) return
                
                const valueStr = String(value).trim()
                if (!valueStr) return
                
                // Thêm vào map theo key
                if (!attributeMap.has(key)) {
                  attributeMap.set(key, new Set())
                }
                attributeMap.get(key).add(valueStr)
              })
            })
            
            if (attributeMap.size === 0) return []
            
            // Hàm kiểm tra xem giá trị có phải là size không
            const isSizeValue = (value) => {
              const valueStr = String(value).trim()
              const valueLower = valueStr.toLowerCase()
              
              // Kiểm tra size chuẩn: XS, S, M, L, XL, XXL, XXXL
              if (/^(xs|s|m|l|xl|xxl|xxxl)$/i.test(valueStr)) return true
              
              // Kiểm tra size với số: 2XL, 3XL, 4XL, 2XS, 3XS, etc.
              if (/^\d+(xs|s|m|l|xl|xxl)$/i.test(valueStr)) return true
              
              // Kiểm tra số size quần áo: 32, 34, 36, 38, 40, 42, etc. (2-3 chữ số)
              if (/^\d{2,3}$/.test(valueStr)) return true
              
              // Kiểm tra format size: 32-34, S/M, L/XL, etc.
              if (/^\d+-\d+$|^[xsmxl]+\/[xsmxl]+$/i.test(valueStr)) return true
              
              // Kiểm tra size với đơn vị: 32kg, 45kg-80kg, etc.
              if (/\d+\s*(kg|kg-\d+kg)$/i.test(valueStr)) return true
              
              return false
            }
            
            // Hàm kiểm tra xem giá trị có phải là màu không
            const isColorValue = (value) => {
              const valueLower = value.toLowerCase()
              const colorKeywords = [
                'đen', 'trắng', 'đỏ', 'xanh', 'vàng', 'hồng', 'cam', 'tím', 'nâu', 
                'kem', 'be', 'ghi', 'xám', 'navy',
                'black', 'white', 'red', 'blue', 'yellow', 'pink', 'orange', 'purple', 
                'brown', 'cream', 'beige', 'gray', 'grey', 'green'
              ]
              return colorKeywords.some(c => valueLower.includes(c))
            }
            
            // Hàm kiểm tra xem giá trị có phải là dung lượng không
            const isCapacityValue = (value) => {
              const valueLower = value.toLowerCase()
              return /^\d+\s*(gb|tb|mb)$/i.test(valueLower) || 
                     /^\d+\s*(gb|tb|mb)/i.test(valueLower) ||
                     valueLower.includes('gb') || valueLower.includes('tb')
            }
            
            // Hàm xác định label dựa trên key và giá trị
            const determineLabel = (key, values) => {
              const keyLower = key.toLowerCase()
              const valueArray = Array.from(values)
              
              // 1. Kiểm tra key name trước (ưu tiên cao nhất)
              if (keyLower.includes('size') || keyLower.includes('cỡ')) {
                return 'Size'
              }
              if (keyLower.includes('color') || keyLower.includes('màu')) {
                return 'Màu sắc'
              }
              if (keyLower.includes('dung lượng') || keyLower.includes('capacity') || keyLower.includes('storage')) {
                return 'Dung lượng'
              }
              
              // 2. Kiểm tra giá trị - ưu tiên này cao hơn map key thông dụng
              // Nếu tất cả giá trị đều trông như size -> Size (quan trọng: kiểm tra TRƯỚC map)
              if (valueArray.length > 0 && valueArray.every(v => isSizeValue(v))) {
                return 'Size'
              }
              
              // Nếu tất cả giá trị đều trông như màu -> Màu sắc
              if (valueArray.length > 0 && valueArray.every(v => isColorValue(v))) {
                return 'Màu sắc'
              }
              
              // Nếu tất cả giá trị đều trông như dung lượng -> Dung lượng
              if (valueArray.length > 0 && valueArray.every(v => isCapacityValue(v))) {
                return 'Dung lượng'
              }
              
              // 3. Map các key thông dụng sang tiếng Việt (fallback)
              const labelMap = {
                'type': 'Loại',
                'loại': 'Loại',
                'category': 'Loại',
                'capacity': 'Dung lượng',
                'storage': 'Dung lượng',
                'ram': 'RAM',
                'rom': 'ROM',
                'bộ nhớ': 'Dung lượng'
              }
              
              // Nếu key có trong map và giá trị không phải size/color -> dùng map
              // Nếu key không có trong map -> dùng tên key gốc
              return labelMap[keyLower] || key
            }
            
            // Group các keys theo label
            const labelGroups = new Map() // label -> Set of values
            
            Array.from(attributeMap.keys()).forEach(key => {
              const values = attributeMap.get(key)
              const label = determineLabel(key, values)
              
              if (!labelGroups.has(label)) {
                labelGroups.set(label, new Set())
              }
              
              // Merge values vào group
              values.forEach(v => labelGroups.get(label).add(v))
            })
            
            // Chuyển đổi sang format result, đảm bảo thứ tự: Size, Màu sắc, các loại khác
            const result = []
            const priorityLabels = ['Size', 'Màu sắc', 'Dung lượng']
            
            // Thêm các label ưu tiên trước
            priorityLabels.forEach(priorityLabel => {
              if (labelGroups.has(priorityLabel)) {
                result.push({
                  label: priorityLabel,
                  options: Array.from(labelGroups.get(priorityLabel)).sort()
                })
                labelGroups.delete(priorityLabel)
              }
            })
            
            // Thêm các label khác
            Array.from(labelGroups.keys()).forEach(label => {
              result.push({
                label: label,
                options: Array.from(labelGroups.get(label)).sort()
              })
            })
            
            return result
          })(),
          
          rating: data.average_rating || 0,
          soldLabel: `${data.total_sold || 0}`,
          inStock: true,
          stockLabel: "Còn hàng",
          categoryName: data.category?.name || "Sản phẩm",
          // Thêm thông tin shop
          shop: data.shop || null,
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

