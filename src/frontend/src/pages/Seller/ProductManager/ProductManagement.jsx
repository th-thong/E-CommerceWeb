"use client"

import "./section.css"
import { useState, useEffect } from "react"
import { createSellerProduct, fetchSellerProducts, deleteSellerProduct, fetchSellerProductDetail, updateSellerProduct } from "@/api/products"
import { fetchCategories } from "@/api/categories"

const TOKEN_KEY = "auth_tokens"

const ProductManagement = () => {
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isEditingPrice, setIsEditingPrice] = useState(false)
  const [isEditingProduct, setIsEditingProduct] = useState(false)
  const [newPrice, setNewPrice] = useState("")
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [isLoadingProductDetail, setIsLoadingProductDetail] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [categories, setCategories] = useState([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [productForm, setProductForm] = useState({
    product_name: "",
    base_price: "",
    category: "",
    description: "",
    discount: "",
    uploaded_images: [],
    variants_input: JSON.stringify([
      {
        price: "",
        quantity: "",
        attributes: { color: "", type: "" },
      },
    ]),
  })
  const [variants, setVariants] = useState([
    {
      price: "",
      quantity: "",
      attributes: { color: "", type: "" },
    },
  ])
  const [currentImages, setCurrentImages] = useState([])
  const [imagesToDelete, setImagesToDelete] = useState([])

  const [products, setProducts] = useState([])

  const loadProducts = async () => {
    setIsLoadingProducts(true)
    try {
      const savedTokens = localStorage.getItem(TOKEN_KEY)
      const tokens = savedTokens ? JSON.parse(savedTokens) : null
      const accessToken = tokens?.access || null
      if (!accessToken) {
        setProducts([])
        return
      }
      const data = await fetchSellerProducts(accessToken)
      const normalized = (data || []).map((item) => {
        const basePrice = Number.parseFloat(item.base_price ?? item.price ?? 0) || 0
        const isActive = item.is_active ?? true
        const isTrendy = item.is_trendy ?? false
        const isFlashSale = item.is_flash_sale ?? false

        return {
          id: item.product_id ?? item.id,
          product_id: item.product_id ?? item.id,
          name: item.product_name ?? item.name,
          price: basePrice,
          // Nếu sản phẩm chưa được admin duyệt (is_active = false) thì hiển thị "Chờ duyệt"
          status: isActive ? "Đang bán" : "Chờ duyệt",
          promoted: isTrendy || isFlashSale,
          promotionType: isTrendy ? "trendy" : isFlashSale ? "flash_sale" : null,
          discountPercent: item.discount ?? 0,
        }
      })
      setProducts(normalized)
    } catch (error) {
      console.error("Failed to load products:", error)
      alert("Không thể tải danh sách sản phẩm")
    } finally {
      setIsLoadingProducts(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true)
      try {
        const savedTokens = localStorage.getItem(TOKEN_KEY)
        const tokens = savedTokens ? JSON.parse(savedTokens) : null
        const accessToken = tokens?.access || null
        const data = await fetchCategories(accessToken)
        setCategories(data || [])
      } catch (error) {
        console.error("Failed to load categories:", error)
        alert("Không thể tải danh mục sản phẩm")
      } finally {
        setIsLoadingCategories(false)
      }
    }
    if (isAddingProduct || isEditingProduct) {
      loadCategories()
    }
  }, [isAddingProduct, isEditingProduct])

  const handleEditPrice = (product) => {
    setSelectedProduct(product)
    setNewPrice(product.price)
    setIsEditingPrice(true)
  }

  const handleSavePrice = () => {
    if (newPrice && selectedProduct) {
      setProducts(products.map((p) => (p.id === selectedProduct.id ? { ...p, price: Number.parseInt(newPrice) } : p)))
      setIsEditingPrice(false)
      setSelectedProduct(null)
    }
  }

  const handleEditProduct = async (product) => {
    setIsLoadingProductDetail(true)
    try {
      const savedTokens = localStorage.getItem(TOKEN_KEY)
      if (!savedTokens) {
        alert("Vui lòng đăng nhập")
        return
      }
      const tokens = JSON.parse(savedTokens)
      const accessToken = tokens?.access
      if (!accessToken) {
        alert("Vui lòng đăng nhập")
        return
      }

      const productDetail = await fetchSellerProductDetail(product.product_id || product.id, accessToken)
      
      // Handle category - could be ID or object
      let categoryId = ""
      if (typeof productDetail.category === 'object' && productDetail.category !== null) {
        categoryId = productDetail.category.category_id || productDetail.category.id || ""
      } else if (typeof productDetail.category === 'number') {
        categoryId = productDetail.category.toString()
      }
      
      // Populate form with product data
      setProductForm({
        product_name: productDetail.product_name || "",
        base_price: productDetail.base_price || "",
        category: categoryId,
        description: productDetail.description || "",
        discount: productDetail.discount || "",
        uploaded_images: [], // New images will be added here
        variants_input: JSON.stringify(productDetail.variants || []),
      })

      // Set variants from product detail
      const productVariants = productDetail.variants || []
      if (productVariants.length > 0) {
        setVariants(productVariants.map(v => ({
          price: v.price ? v.price.toString() : "",
          quantity: v.quantity ? v.quantity.toString() : "",
          attributes: v.attributes || { color: "", type: "" },
        })))
      } else {
        setVariants([{
          price: "",
          quantity: "",
          attributes: { color: "", type: "" },
        }])
      }

      setSelectedProduct(productDetail)
      setCurrentImages(productDetail.images || [])
      setImagesToDelete([])
      setIsEditingProduct(true)
    } catch (error) {
      console.error("Error loading product detail:", error)
      alert("Không thể tải thông tin sản phẩm: " + (error.message || "Vui lòng thử lại"))
    } finally {
      setIsLoadingProductDetail(false)
    }
  }

  const handleUpdateProduct = async () => {
    if (!selectedProduct) return

    if (!productForm.product_name || !productForm.base_price || !productForm.category || !productForm.description) {
      alert("Vui lòng điền đầy đủ thông tin sản phẩm")
      return
    }
    if (variants.length === 0 || variants.some((v) => !v.price || !v.quantity)) {
      alert("Vui lòng điền đầy đủ thông tin biến thể sản phẩm (giá, số lượng)")
      return
    }

    const savedTokens = localStorage.getItem(TOKEN_KEY)
    if (!savedTokens) {
      alert("Vui lòng đăng nhập để cập nhật sản phẩm")
      return
    }

    const tokens = JSON.parse(savedTokens)
    if (!tokens?.access) {
      alert("Vui lòng đăng nhập để cập nhật sản phẩm")
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("product_name", productForm.product_name)
      formData.append("base_price", productForm.base_price)
      formData.append("category", productForm.category)
      formData.append("description", productForm.description)
      formData.append("discount", productForm.discount || "0")

      // Gửi danh sách image IDs cần xóa
      if (imagesToDelete.length > 0) {
        formData.append("images_to_delete", JSON.stringify(imagesToDelete))
      }

      // Only append new images if any were selected
      if (productForm.uploaded_images.length > 0) {
        productForm.uploaded_images.forEach((file) => {
          formData.append("uploaded_images", file)
        })
      }

      // Convert variants to proper format with numeric values
      const formattedVariants = variants.map((v) => ({
        price: Number.parseInt(v.price) || 0,
        quantity: Number.parseInt(v.quantity) || 0,
        attributes: {
          color: v.attributes.color || "",
          type: v.attributes.type || "",
        },
      }))

      formData.append("variants_input", JSON.stringify(formattedVariants))

      const productId = selectedProduct.product_id || selectedProduct.id
      await updateSellerProduct(productId, formData, tokens.access)
      alert("Cập nhật sản phẩm thành công!")
      
      // Reload lại product detail để cập nhật hình ảnh
      const productDetail = await fetchSellerProductDetail(productId, tokens.access)
      setCurrentImages(productDetail.images || [])
      setImagesToDelete([])
      setSelectedProduct(productDetail)
      
      // Refresh danh sách sản phẩm sau khi cập nhật
      await loadProducts()
    } catch (error) {
      console.error("Error updating product:", error)
      alert(`Lỗi khi cập nhật sản phẩm: ${error.message || "Vui lòng thử lại"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetEditForm = () => {
    setIsEditingProduct(false)
    setSelectedProduct(null)
    setCurrentImages([])
    setImagesToDelete([])
    setProductForm({
      product_name: "",
      base_price: "",
      category: "",
      description: "",
      discount: "",
      uploaded_images: [],
      variants_input: JSON.stringify([
        {
          price: "",
          quantity: "",
          attributes: { color: "", type: "" },
        },
      ]),
    })
    setVariants([
      {
        price: "",
        quantity: "",
        attributes: { color: "", type: "" },
      },
    ])
  }

  const handleDeleteImage = (imageId) => {
    // Thêm vào danh sách cần xóa
    setImagesToDelete([...imagesToDelete, imageId])
    // Xóa khỏi danh sách hiển thị
    setCurrentImages(currentImages.filter(img => img.id !== imageId))
  }


  const resetProductForm = () => {
    setIsAddingProduct(false)
    setProductForm({
      product_name: "",
      base_price: "",
      category: "",
      description: "",
      discount: "",
      uploaded_images: [],
      variants_input: JSON.stringify([
        {
          price: "",
          quantity: "",
          attributes: { color: "", type: "" },
        },
      ]),
    })
    setVariants([
      {
        price: "",
        quantity: "",
        attributes: { color: "", type: "" },
      },
    ])
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    setProductForm({ ...productForm, uploaded_images: files })
  }

  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...variants]
    if (field.includes(".")) {
      const [parent, child] = field.split(".")
      updatedVariants[index] = {
        ...updatedVariants[index],
        [parent]: {
          ...updatedVariants[index][parent],
          [child]: value,
        },
      }
    } else {
      updatedVariants[index] = {
        ...updatedVariants[index],
        [field]: value,
      }
    }
    setVariants(updatedVariants)
    setProductForm({
      ...productForm,
      variants_input: JSON.stringify(updatedVariants),
    })
  }

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        price: "",
        quantity: "",
        attributes: { color: "", type: "" },
      },
    ])
  }

  const removeVariant = (index) => {
    const updatedVariants = variants.filter((_, i) => i !== index)
    setVariants(updatedVariants)
    setProductForm({
      ...productForm,
      variants_input: JSON.stringify(updatedVariants),
    })
  }

  const handleCreateProduct = async () => {
    if (!productForm.product_name || !productForm.base_price || !productForm.category || !productForm.description) {
      alert("Vui lòng điền đầy đủ thông tin sản phẩm")
      return
    }
    if (productForm.uploaded_images.length === 0) {
      alert("Vui lòng chọn ít nhất một hình ảnh")
      return
    }
    if (variants.length === 0 || variants.some((v) => !v.price || !v.quantity)) {
      alert("Vui lòng điền đầy đủ thông tin biến thể sản phẩm (giá, số lượng)")
      return
    }

    const savedTokens = localStorage.getItem(TOKEN_KEY)
    if (!savedTokens) {
      alert("Vui lòng đăng nhập để thêm sản phẩm")
      return
    }

    const tokens = JSON.parse(savedTokens)
    if (!tokens?.access) {
      alert("Vui lòng đăng nhập để thêm sản phẩm")
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("product_name", productForm.product_name)
      formData.append("base_price", productForm.base_price)
      formData.append("category", productForm.category)
      formData.append("description", productForm.description)
      formData.append("discount", "0")

      productForm.uploaded_images.forEach((file) => {
        formData.append("uploaded_images", file)
      })

      // Convert variants to proper format with numeric values
      const formattedVariants = variants.map((v) => ({
        price: Number.parseInt(v.price) || 0,
        quantity: Number.parseInt(v.quantity) || 0,
        attributes: {
          color: v.attributes.color || "",
          type: v.attributes.type || "",
        },
      }))

      formData.append("variants_input", JSON.stringify(formattedVariants))

      await createSellerProduct(formData, tokens.access)
      alert("Thêm sản phẩm thành công! Sản phẩm sẽ ở trạng thái 'Chờ duyệt' cho đến khi admin phê duyệt.")
      resetProductForm()
      // Refresh danh sách sản phẩm sau khi tạo mới
      await loadProducts()
    } catch (error) {
      console.error("Error creating product:", error)
      alert(`Lỗi khi thêm sản phẩm: ${error.message || "Vui lòng thử lại"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteProduct = async () => {
    if (!productToDelete) return

    const savedTokens = localStorage.getItem(TOKEN_KEY)
    if (!savedTokens) {
      alert("Vui lòng đăng nhập")
      return
    }

    const tokens = JSON.parse(savedTokens)
    const accessToken = tokens?.access

    if (!accessToken) {
      alert("Vui lòng đăng nhập")
      return
    }

    setIsDeleting(true)
    try {
      await deleteSellerProduct(productToDelete.product_id || productToDelete.id, accessToken)
      alert("Xóa sản phẩm thành công!")
      setProductToDelete(null)
      // Refresh danh sách sản phẩm sau khi xóa
      await loadProducts()
    } catch (error) {
      console.error("Error deleting product:", error)
      alert(error.message || "Có lỗi xảy ra khi xóa sản phẩm")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="section">
      <div className="section-header">
        <h2>Quản Lý Sản Phẩm</h2>
        <div className="header-buttons">
          <button className="add-product-btn" onClick={() => setIsAddingProduct(true)}>
            + Thêm Sản Phẩm
          </button>
        </div>
      </div>

      <div className="products-table">
        <table>
          <thead>
            <tr>
              <th>Tên Sản Phẩm</th>
              <th>Giá</th>
              <th>Trạng Thái</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  {product.name}
                  {product.promoted && (
                    <span className="promoted-badge">
                      {product.promotionType === "trendy" ? "Trendy" : `Flash Sale (-${product.discountPercent}%)`}
                    </span>
                  )}
                </td>
                <td className="price">{product.price.toLocaleString()}₫</td>
                <td>
                  <span className={`status ${product.status === "Chờ duyệt" ? "pending" : "active"}`}>
                    {product.status}
                  </span>
                </td>
                <td className="actions">
                  <button className="edit-btn" onClick={() => handleEditProduct(product)}>
                    Chỉnh sửa
                  </button>
                  <button 
                    className="delete-btn" 
                    onClick={() => setProductToDelete(product)}
                    style={{ 
                      marginLeft: "8px", 
                      backgroundColor: "#dc3545", 
                      color: "white",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isEditingPrice && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Chỉnh sửa giá sản phẩm</h3>
            <p className="product-name">{selectedProduct.name}</p>
            <div className="input-group">
              <label>Giá mới (đ)</label>
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="Nhập giá mới"
              />
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setIsEditingPrice(false)}>
                Hủy
              </button>
              <button className="save-btn" onClick={handleSavePrice}>
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditingProduct && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: "800px", maxHeight: "90vh", overflowY: "auto" }}>
            <h3>Chỉnh sửa Sản Phẩm</h3>

            {isLoadingProductDetail ? (
              <div style={{ padding: "20px", textAlign: "center" }}>Đang tải thông tin sản phẩm...</div>
            ) : (
              <>
                <div className="input-group">
                  <label>Tên sản phẩm *</label>
                  <input
                    type="text"
                    value={productForm.product_name}
                    onChange={(e) => setProductForm({ ...productForm, product_name: e.target.value })}
                    placeholder="Nhập tên sản phẩm"
                  />
                </div>

                <div className="input-group">
                  <label>Giá cơ bản (đ) *</label>
                  <input
                    type="number"
                    value={productForm.base_price}
                    onChange={(e) => setProductForm({ ...productForm, base_price: e.target.value })}
                    placeholder="Nhập giá cơ bản"
                  />
                </div>

                <div className="input-group">
                  <label>Giảm giá (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={productForm.discount}
                    onChange={(e) => setProductForm({ ...productForm, discount: e.target.value })}
                    placeholder="Nhập phần trăm giảm giá (0-100)"
                    className="discount-input"
                  />
                  {productForm.discount && Number.parseInt(productForm.discount) >= 50 && (
                    <div style={{ marginTop: "8px", fontSize: "12px", color: "#00b2ff" }}>
                      ⚡ Sản phẩm này sẽ được hiển thị trong Flash Sale
                    </div>
                  )}
                </div>

                <div className="input-group">
                  <label>Danh mục *</label>
                  {isLoadingCategories ? (
                    <div>Đang tải danh mục...</div>
                  ) : (
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map((cat) => (
                        <option key={cat.category_id} value={cat.category_id}>
                          {cat.category_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="input-group">
                  <label>Mô tả *</label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="Nhập mô tả sản phẩm"
                    rows="4"
                  />
                </div>

                <div className="input-group">
                  <label>Hình ảnh mới (tùy chọn)</label>
                  <input type="file" multiple accept="image/*" onChange={handleImageChange} />
                  {productForm.uploaded_images.length > 0 && (
                    <div style={{ marginTop: "10px", fontSize: "14px" }}>
                      Đã chọn {productForm.uploaded_images.length} hình ảnh mới
                    </div>
                  )}
                  
                  {currentImages.length > 0 && (
                    <div style={{ marginTop: "15px" }}>
                      <div style={{ fontSize: "14px", marginBottom: "10px", color: "#fff" }}>
                        Hình ảnh hiện tại ({currentImages.length} hình):
                      </div>
                      <div style={{ 
                        display: "grid", 
                        gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", 
                        gap: "10px",
                        marginTop: "10px"
                      }}>
                        {currentImages.map((image) => (
                          <div 
                            key={image.id} 
                            style={{ 
                              position: "relative",
                              border: "1px solid rgba(255, 94, 0, 0.3)",
                              borderRadius: "8px",
                              overflow: "hidden",
                              aspectRatio: "1"
                            }}
                          >
                            <img 
                              src={image.image_url} 
                              alt={`Image ${image.id}`}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover"
                              }}
                              onError={(e) => {
                                e.target.src = "/placeholder.svg"
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteImage(image.id)}
                              style={{
                                position: "absolute",
                                top: "4px",
                                right: "4px",
                                background: "rgba(220, 53, 69, 0.9)",
                                color: "white",
                                border: "none",
                                borderRadius: "50%",
                                width: "24px",
                                height: "24px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "14px",
                                fontWeight: "bold",
                                transition: "all 0.2s ease"
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = "rgba(220, 53, 69, 1)"
                                e.target.style.transform = "scale(1.1)"
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = "rgba(220, 53, 69, 0.9)"
                                e.target.style.transform = "scale(1)"
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                      {imagesToDelete.length > 0 && (
                        <div style={{ marginTop: "10px", fontSize: "12px", color: "#ff5e00" }}>
                          {imagesToDelete.length} hình ảnh sẽ bị xóa khi lưu
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="input-group">
                  <label>
                    Biến thể sản phẩm *
                    <button
                      type="button"
                      onClick={addVariant}
                      style={{ marginLeft: "10px", padding: "5px 10px", fontSize: "12px" }}
                    >
                      + Thêm biến thể
                    </button>
                  </label>
                  {variants.map((variant, index) => (
                    <div key={index} style={{ border: "1px solid #ddd", padding: "10px", marginBottom: "10px", borderRadius: "4px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                        <strong>Biến thể {index + 1}</strong>
                        {variants.length > 1 && (
                          <button type="button" onClick={() => removeVariant(index)} style={{ color: "red" }}>
                            Xóa
                          </button>
                        )}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                        <div>
                          <label style={{ fontSize: "12px" }}>Giá (đ) *</label>
                          <input
                            type="number"
                            value={variant.price}
                            onChange={(e) => handleVariantChange(index, "price", e.target.value)}
                            placeholder="Giá"
                            style={{ width: "100%" }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: "12px" }}>Số lượng *</label>
                          <input
                            type="number"
                            value={variant.quantity}
                            onChange={(e) => handleVariantChange(index, "quantity", e.target.value)}
                            placeholder="Số lượng"
                            style={{ width: "100%" }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: "12px" }}>Màu sắc</label>
                          <input
                            type="text"
                            value={variant.attributes.color}
                            onChange={(e) => handleVariantChange(index, "attributes.color", e.target.value)}
                            placeholder="Màu sắc"
                            style={{ width: "100%" }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: "12px" }}>Loại/Kích cỡ</label>
                          <input
                            type="text"
                            value={variant.attributes.type}
                            onChange={(e) => handleVariantChange(index, "attributes.type", e.target.value)}
                            placeholder="Loại/Kích cỡ"
                            style={{ width: "100%" }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="modal-actions">
                  <button className="cancel-btn" onClick={resetEditForm} disabled={isSubmitting}>
                    Hủy
                  </button>
                  <button className="save-btn" onClick={handleUpdateProduct} disabled={isSubmitting}>
                    {isSubmitting ? "Đang cập nhật..." : "Cập Nhật Sản Phẩm"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {isAddingProduct && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: "800px", maxHeight: "90vh", overflowY: "auto" }}>
            <h3>Thêm Sản Phẩm Mới</h3>

            <div className="input-group">
              <label>Tên sản phẩm *</label>
              <input
                type="text"
                value={productForm.product_name}
                onChange={(e) => setProductForm({ ...productForm, product_name: e.target.value })}
                placeholder="Nhập tên sản phẩm"
              />
            </div>

            <div className="input-group">
              <label>Giá cơ bản (đ) *</label>
              <input
                type="number"
                value={productForm.base_price}
                onChange={(e) => setProductForm({ ...productForm, base_price: e.target.value })}
                placeholder="Nhập giá cơ bản"
              />
            </div>

            <div className="input-group">
              <label>Danh mục *</label>
              {isLoadingCategories ? (
                <div>Đang tải danh mục...</div>
              ) : (
                <select
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map((cat) => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {cat.category_name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="input-group">
              <label>Mô tả *</label>
              <textarea
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                placeholder="Nhập mô tả sản phẩm"
                rows="4"
              />
            </div>

            <div className="input-group">
              <label>Hình ảnh *</label>
              <input type="file" multiple accept="image/*" onChange={handleImageChange} />
              {productForm.uploaded_images.length > 0 && (
                <div style={{ marginTop: "10px", fontSize: "14px" }}>
                  Đã chọn {productForm.uploaded_images.length} hình ảnh
                </div>
              )}
            </div>

            <div className="input-group">
              <label>
                Biến thể sản phẩm *
                <button
                  type="button"
                  onClick={addVariant}
                  style={{ marginLeft: "10px", padding: "5px 10px", fontSize: "12px" }}
                >
                  + Thêm biến thể
                </button>
              </label>
              {variants.map((variant, index) => (
                <div key={index} style={{ border: "1px solid #ddd", padding: "10px", marginBottom: "10px", borderRadius: "4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <strong>Biến thể {index + 1}</strong>
                    {variants.length > 1 && (
                      <button type="button" onClick={() => removeVariant(index)} style={{ color: "red" }}>
                        Xóa
                      </button>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                    <div>
                      <label style={{ fontSize: "12px" }}>Giá (đ) *</label>
                      <input
                        type="number"
                        value={variant.price}
                        onChange={(e) => handleVariantChange(index, "price", e.target.value)}
                        placeholder="Giá"
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px" }}>Số lượng *</label>
                      <input
                        type="number"
                        value={variant.quantity}
                        onChange={(e) => handleVariantChange(index, "quantity", e.target.value)}
                        placeholder="Số lượng"
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px" }}>Màu sắc</label>
                      <input
                        type="text"
                        value={variant.attributes.color}
                        onChange={(e) => handleVariantChange(index, "attributes.color", e.target.value)}
                        placeholder="Màu sắc"
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px" }}>Loại/Kích cỡ</label>
                      <input
                        type="text"
                        value={variant.attributes.type}
                        onChange={(e) => handleVariantChange(index, "attributes.type", e.target.value)}
                        placeholder="Loại/Kích cỡ"
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={resetProductForm} disabled={isSubmitting}>
                Hủy
              </button>
              <button className="save-btn" onClick={handleCreateProduct} disabled={isSubmitting}>
                {isSubmitting ? "Đang thêm..." : "Thêm Sản Phẩm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {productToDelete && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Xác nhận xóa sản phẩm</h3>
            <p className="product-name">
              Bạn có chắc chắn muốn xóa sản phẩm <strong>"{productToDelete.name}"</strong>?
            </p>
            <p style={{ color: "#dc3545", fontSize: "14px", marginTop: "0px", marginBottom: "15px" }}>
              Hành động này không thể hoàn tác.
            </p>
            <div className="modal-actions">
              <button 
                className="cancel-btn" 
                onClick={() => setProductToDelete(null)}
                disabled={isDeleting}
              >
                Hủy
              </button>
              <button 
                className="save-btn" 
                onClick={handleDeleteProduct}
                disabled={isDeleting}
                style={{ backgroundColor: "#dc3545" }}
              >
                {isDeleting ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductManagement
