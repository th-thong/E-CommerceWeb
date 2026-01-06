"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { registerAsSeller } from "@/api/shops"
import "./SellerRegistration.css"

const TOKEN_KEY = "auth_tokens"

const SellerRegistration = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    shop_name: "",
    shop_phone_number: "",
    shop_address: "",
    shop_email: "",
    description: ""
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null) // { type: 'success' | 'error', message: string }

  const validate = () => {
    const newErrors = {}
    
    if (!formData.shop_name.trim()) {
      newErrors.shop_name = "Vui lòng nhập tên shop"
    }
    
    if (!formData.shop_phone_number.trim()) {
      newErrors.shop_phone_number = "Vui lòng nhập số điện thoại"
    } else if (!/^[0-9]{10,11}$/.test(formData.shop_phone_number.replace(/\s/g, ""))) {
      newErrors.shop_phone_number = "Số điện thoại không hợp lệ"
    }
    
    if (!formData.shop_address.trim()) {
      newErrors.shop_address = "Vui lòng nhập địa chỉ lấy hàng"
    }
    
    if (!formData.shop_email.trim()) {
      newErrors.shop_email = "Vui lòng nhập email"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.shop_email)) {
      newErrors.shop_email = "Email không hợp lệ"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) {
      return
    }

    // Check if user is logged in
    const savedTokens = localStorage.getItem(TOKEN_KEY)
    if (!savedTokens) {
      setSubmitStatus({
        type: "error",
        message: "Vui lòng đăng nhập để đăng ký trở thành người bán"
      })
      setTimeout(() => {
        navigate("/")
      }, 2000)
      return
    }

    const tokens = JSON.parse(savedTokens)
    const accessToken = tokens?.access

    if (!accessToken) {
      setSubmitStatus({
        type: "error",
        message: "Vui lòng đăng nhập để đăng ký trở thành người bán"
      })
      setTimeout(() => {
        navigate("/")
      }, 2000)
      return
    }

    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      await registerAsSeller(formData, accessToken)
      setSubmitStatus({
        type: "success",
        message: "Đăng ký thành công! Yêu cầu của bạn đang được admin xem xét. Bạn sẽ nhận được thông báo khi được phê duyệt."
      })
      
      // Reset form
      setFormData({
        shop_name: "",
        shop_phone_number: "",
        shop_address: "",
        shop_email: "",
        description: ""
      })
      
      // Redirect to home after 3 seconds
      setTimeout(() => {
        navigate("/")
      }, 3000)
    } catch (error) {
      const errorMessage = error.message || "Có lỗi xảy ra khi đăng ký. Vui lòng thử lại."
      setSubmitStatus({
        type: "error",
        message: errorMessage
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="seller-registration-page">
      <div className="registration-container">
        <div className="registration-header">
          <h1>Đăng Ký Trở Thành Người Bán ShopLiteX</h1>
          <p>Điền thông tin dưới đây để đăng ký mở shop trên ShopLiteX</p>
        </div>

        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-group">
            <label htmlFor="shop_name">
              Tên Shop <span className="required">*</span>
            </label>
            <input
              type="text"
              id="shop_name"
              name="shop_name"
              value={formData.shop_name}
              onChange={handleChange}
              placeholder="Nhập tên shop của bạn"
              className={errors.shop_name ? "error" : ""}
            />
            {errors.shop_name && (
              <span className="error-message">{errors.shop_name}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="shop_phone_number">
              Số Điện Thoại <span className="required">*</span>
            </label>
            <input
              type="tel"
              id="shop_phone_number"
              name="shop_phone_number"
              value={formData.shop_phone_number}
              onChange={handleChange}
              placeholder="Nhập số điện thoại (10-11 số)"
              className={errors.shop_phone_number ? "error" : ""}
            />
            {errors.shop_phone_number && (
              <span className="error-message">{errors.shop_phone_number}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="shop_address">
              Địa Chỉ Lấy Hàng <span className="required">*</span>
            </label>
            <textarea
              id="shop_address"
              name="shop_address"
              value={formData.shop_address}
              onChange={handleChange}
              placeholder="Nhập địa chỉ lấy hàng (số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố)"
              rows={3}
              className={errors.shop_address ? "error" : ""}
            />
            {errors.shop_address && (
              <span className="error-message">{errors.shop_address}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="shop_email">
              Email <span className="required">*</span>
            </label>
            <input
              type="email"
              id="shop_email"
              name="shop_email"
              value={formData.shop_email}
              onChange={handleChange}
              placeholder="Nhập email liên hệ"
              className={errors.shop_email ? "error" : ""}
            />
            {errors.shop_email && (
              <span className="error-message">{errors.shop_email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Mô Tả Shop (Tùy chọn)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Mô tả về shop của bạn (sản phẩm, dịch vụ, v.v.)"
              rows={4}
            />
          </div>

          {submitStatus && (
            <div className={`submit-status ${submitStatus.type}`}>
              {submitStatus.type === "success" ? "✓" : "⚠"} {submitStatus.message}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/")}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang gửi..." : "Gửi Đăng Ký"}
            </button>
          </div>

          <div className="form-note">
            <p>
              <strong>Lưu ý:</strong> Sau khi gửi đăng ký, yêu cầu của bạn sẽ được admin xem xét. 
              Bạn sẽ nhận được thông báo khi tài khoản được phê duyệt và có thể bắt đầu bán hàng.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SellerRegistration

