"use client"

import "./section.css"
import { useState, useEffect } from "react"
import { createSellerProduct } from "../../../api/products"
import { fetchCategories } from "../../../api/categories"

const TOKEN_KEY = "auth_tokens"

const ProductManagement = () => {
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isEditingPrice, setIsEditingPrice] = useState(false)
  const [newPrice, setNewPrice] = useState("")
  const [isPromotingProducts, setIsPromotingProducts] = useState(false)
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [productForm, setProductForm] = useState({
    product_name: "",
    base_price: "",
    category: "",
    description: "",
    uploaded_images: [],
    variants_input: JSON.stringify([
      {
        sku: "",
        price: "",
        quantity: "",
        attributes: { color: "", type: "" },
      },
    ]),
  })
  const [variants, setVariants] = useState([
    {
      sku: "",
      price: "",
      quantity: "",
      attributes: { color: "", type: "" },
    },
  ])
  const [promotionForm, setPromotionForm] = useState({
    type: "trendy",
    startDate: "",
    endDate: "",
    discount: 0,
  })

  const [products, setProducts] = useState([
    { id: 1, name: "Áo thun nam casual", price: 150000, status: "Đang bán", promoted: false },
    { id: 2, name: "Quần jean nam", price: 350000, status: "Đang bán", promoted: false },
    { id: 3, name: "Giày thể thao", price: 650000, status: "Chờ duyệt", promoted: false },
    { id: 4, name: "Áo khoác", price: 450000, status: "Chờ duyệt", promoted: false },
  ])

  useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true)
      try {
        const data = await fetchCategories()
        setCategories(data || [])
      } catch (error) {
        console.error("Failed to load categories:", error)
        alert("Không thể tải danh mục sản phẩm")
      } finally {
        setIsLoadingCategories(false)
      }
    }
    if (isAddingProduct) {
      loadCategories()
    }
  }, [isAddingProduct])

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

  const handleSelectProduct = (product) => {
    if (product.status !== "Đang bán") {
      alert("Chỉ có thể đưa sản phẩm đã được duyệt vào Trendy/Flash Sale")
      return
    }
    setSelectedProducts((prev) =>
      prev.find((p) => p.id === product.id) ? prev.filter((p) => p.id !== product.id) : [...prev, product],
    )
  }

  const handlePromoteProducts = () => {
    if (selectedProducts.length === 0) {
      alert("Vui lòng chọn ít nhất một sản phẩm")
      return
    }
    if (!promotionForm.startDate || !promotionForm.endDate) {
      alert("Vui lòng nhập thời gian bắt đầu và kết thúc")
      return
    }
    if (promotionForm.type === "flash_sale" && promotionForm.discount <= 0) {
      alert("Vui lòng nhập mức giảm giá hợp lệ")
      return
    }

    const updatedProducts = products.map((p) =>
      selectedProducts.find((sp) => sp.id === p.id)
        ? {
            ...p,
            promoted: true,
            promotionType: promotionForm.type,
            discountPercent: promotionForm.discount,
          }
        : p,
    )
    setProducts(updatedProducts)
    alert("Sản phẩm đã được đưa vào Trendy/Flash Sale thành công!")
    resetPromotionForm()
  }

  const resetPromotionForm = () => {
    setIsPromotingProducts(false)
    setSelectedProducts([])
    setPromotionForm({ type: "trendy", startDate: "", endDate: "", discount: 0 })
  }

  const resetProductForm = () => {
    setIsAddingProduct(false)
    setProductForm({
      product_name: "",
      base_price: "",
      category: "",
      description: "",
      uploaded_images: [],
      variants_input: JSON.stringify([
        {
          sku: "",
          price: "",
          quantity: "",
          attributes: { color: "", type: "" },
        },
      ]),
    })
    setVariants([
      {
        sku: "",
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
        sku: "",
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
    if (variants.length === 0 || variants.some((v) => !v.sku || !v.price || !v.quantity)) {
      alert("Vui lòng điền đầy đủ thông tin biến thể sản phẩm")
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

      productForm.uploaded_images.forEach((file) => {
        formData.append("uploaded_images", file)
      })

      // Convert variants to proper format with numeric values
      const formattedVariants = variants.map((v) => ({
        sku: v.sku,
        price: Number.parseInt(v.price) || 0,
        quantity: Number.parseInt(v.quantity) || 0,
        attributes: {
          color: v.attributes.color || "",
          type: v.attributes.type || "",
        },
      }))

      formData.append("variants_input", JSON.stringify(formattedVariants))

      await createSellerProduct(formData, tokens.access)
      alert("Thêm sản phẩm thành công!")
      resetProductForm()
      // Optionally refresh the products list here
    } catch (error) {
      console.error("Error creating product:", error)
      alert(`Lỗi khi thêm sản phẩm: ${error.message || "Vui lòng thử lại"}`)
    } finally {
      setIsSubmitting(false)
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
          <button className="promote-btn" onClick={() => setIsPromotingProducts(true)}>
            📈 Đẩy Lên Trendy/Flash Sale
          </button>
        </div>
      </div>

      <div className="products-table">
        <table>
          <thead>
            <tr>
              <th style={{ width: "40px" }}></th>
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
                  <input
                    type="checkbox"
                    checked={selectedProducts.some((p) => p.id === product.id)}
                    onChange={() => handleSelectProduct(product)}
                    disabled={product.status !== "Đang bán"}
                  />
                </td>
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
                  <button className="edit-btn" onClick={() => handleEditPrice(product)}>
                    Chỉnh sửa
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

      {isPromotingProducts && (
        <div className="modal-overlay">
          <div className="modal promotion-modal">
            <h3>Đẩy Sản Phẩm Lên Trendy/Flash Sale</h3>

            <div className="selected-products-list">
              <h4>Sản phẩm được chọn ({selectedProducts.length})</h4>
              <div className="product-chips">
                {selectedProducts.map((p) => (
                  <div key={p.id} className="product-chip">
                    {p.name}
                    <button onClick={() => handleSelectProduct(p)}>×</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label>Loại hiển thị</label>
              <select
                value={promotionForm.type}
                onChange={(e) => setPromotionForm({ ...promotionForm, type: e.target.value })}
              >
                <option value="trendy">Trendy</option>
                <option value="flash_sale">Flash Sale</option>
              </select>
            </div>

            <div className="input-group">
              <label>Thời gian bắt đầu</label>
              <input
                type="datetime-local"
                value={promotionForm.startDate}
                onChange={(e) => setPromotionForm({ ...promotionForm, startDate: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label>Thời gian kết thúc</label>
              <input
                type="datetime-local"
                value={promotionForm.endDate}
                onChange={(e) => setPromotionForm({ ...promotionForm, endDate: e.target.value })}
              />
            </div>

            {promotionForm.type === "flash_sale" && (
              <div className="input-group">
                <label>Mức giảm giá (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={promotionForm.discount}
                  onChange={(e) => setPromotionForm({ ...promotionForm, discount: Number.parseInt(e.target.value) })}
                  placeholder="Nhập mức giảm giá"
                />
              </div>
            )}

            <div className="modal-actions">
              <button className="cancel-btn" onClick={resetPromotionForm}>
                Hủy
              </button>
              <button className="save-btn" onClick={handlePromoteProducts}>
                Xác Nhận Đẩy Lên
              </button>
            </div>
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
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
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
                      <label style={{ fontSize: "12px" }}>SKU *</label>
                      <input
                        type="text"
                        value={variant.sku}
                        onChange={(e) => handleVariantChange(index, "sku", e.target.value)}
                        placeholder="SKU"
                        style={{ width: "100%" }}
                      />
                    </div>
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
    </div>
  )
}

export default ProductManagement
