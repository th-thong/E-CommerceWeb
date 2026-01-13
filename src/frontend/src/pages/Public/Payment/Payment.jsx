import { useMemo, useState } from "react"
import { useCart } from "@/contexts/CartContext"
import { createOrder } from "@/api/orders"
import { confirmCOD } from "@/api/payment"
import { getProfile } from "@/api/auth"
import { useNavigate, Link } from "react-router-dom"
import { useNotificationHelpers } from "@/hooks/useNotificationHelpers"
import "./Payment.css"

const formatCurrency = (v) => v.toLocaleString("vi-VN") + "đ"

const TOKEN_KEY = "auth_tokens"

export default function Payment() {
  const { cartItems, getTotalPrice, clearCart } = useCart()
  const navigate = useNavigate()
  const { notifyOrderSuccess } = useNotificationHelpers()

  const [paymentMethod, setPaymentMethod] = useState("cod")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [exp, setExp] = useState("")
  const [cvv, setCvv] = useState("")
  const [note, setNote] = useState("")
  const [status, setStatus] = useState(null) // { type: 'success' | 'error', message: string }
  const [isPaying, setIsPaying] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)

  const getToken = () => {
    const saved = localStorage.getItem(TOKEN_KEY)
    if (saved) {
      try {
        const tokens = JSON.parse(saved)
        return tokens.access
      } catch {
        return null
      }
    }
    return null
  }

  // Xử lý khi nhấn nút "Sử dụng thông tin từ tài khoản"
  const handleFillFromAccount = async () => {
    const token = getToken()
    if (!token) {
      setStatus({ type: "error", message: "Vui lòng đăng nhập để sử dụng tính năng này" })
      return
    }

    setIsLoadingProfile(true)
    setStatus(null)

    try {
      const profile = await getProfile(token)
      
      // Chỉ fill phone và address, không fill name
      // Fill phone nếu có (ưu tiên phone_number, sau đó shop_phone_number)
      if (profile.phone_number) {
        setPhone(profile.phone_number)
      } else if (profile.shop_phone_number) {
        setPhone(profile.shop_phone_number)
      }
      
      // Fill address nếu có (ưu tiên address, sau đó shop_address)
      if (profile.address && profile.address !== "None") {
        setAddress(profile.address)
      } else if (profile.shop_address) {
        setAddress(profile.shop_address)
      }

      setStatus({ type: "success", message: "Đã điền thông tin từ tài khoản" })
    } catch (error) {
      console.error("Error loading profile:", error)
      setStatus({ type: "error", message: "Không thể tải thông tin từ tài khoản. Vui lòng thử lại." })
    } finally {
      setIsLoadingProfile(false)
    }
  }

  const calculateItemPrice = (item) => {
    const price = item.variant?.price || item.product.base_price
    const discount = item.product.discount || 0
    return price * (1 - discount / 100)
  }

  const totals = useMemo(() => {
    const subtotal = getTotalPrice()
    return { subtotal, total: subtotal }
  }, [cartItems, getTotalPrice])

  const validate = () => {
    if (!cartItems || cartItems.length === 0) return "Giỏ hàng đang trống, không thể thanh toán."
    if (!name.trim() || !phone.trim() || !address.trim()) return "Vui lòng điền đủ họ và tên người nhận, SĐT, địa chỉ."
    return null
  }

  const handlePay = async () => {
    const err = validate()
    if (err) {
      setStatus({ type: "error", message: err })
      return
    }

    const token = getToken()
    if (!token) {
      setStatus({ type: "error", message: "Vui lòng đăng nhập để thanh toán" })
      return
    }

    setIsPaying(true)
    setStatus(null)

    try {
      // 1. Chuẩn bị items theo format Serializer mong đợi
      const orderItems = cartItems.map(item => ({
        product_id: item.product.product_id || item.product.id,
        variant_id: item.variant?.variant_id || item.variant?.id || null,
        quantity: item.quantity
      }))

      // 2. Tạo đối tượng orderData chứa ĐẦY ĐỦ thông tin Serializer yêu cầu
      const orderData = {
        items: orderItems,
        payment_type: paymentMethod === "cod" ? "COD" : "VNPAY",
        full_name: name,
        phone_number: phone,
        address: address
      }
      
      // Ghi chú là tùy chọn, chỉ thêm vào nếu có giá trị
      if (note && note.trim()) {
        orderData.note = note.trim()
      }

      const orderResponse = await createOrder(orderData, token)
      
      const orderId = orderResponse.id || orderResponse.order_id

      // 3. Xử lý sau khi tạo đơn hàng
      if (paymentMethod === "cod") {
        await confirmCOD(orderId, token)
        clearCart()
        // Thêm thông báo
        notifyOrderSuccess(orderId)
        setStatus({ 
          type: "success", 
          message: "Đặt hàng thành công! Đơn hàng đang chờ xác nhận." 
        })
        // Có thể navigate sang trang đơn hàng sau 2s
        setTimeout(() => navigate("/orders"), 2000)
      } else {
        // VNPAY - redirect đến payment URL
        if (orderResponse.payment_url) {
          window.location.href = orderResponse.payment_url
        } else {
          setStatus({ type: "error", message: "Không thể khởi tạo cổng thanh toán VNPAY" })
        }
      }
    } catch (error) {
      console.error("Payment error:", error)
      // Hiển thị lỗi từ backend (ví dụ: hết hàng)
      const errorMsg = error.response?.data?.detail || error.message || "Thanh toán thất bại."
      setStatus({ type: "error", message: errorMsg })
    } finally {
      setIsPaying(false)
    }
  }

  const handleCancelPayment = () => {
    setStatus({ type: "error", message: "Giao dịch bị hủy. Đơn hàng giữ trạng thái 'Chờ thanh toán'." })
  }

  return (
    <div className="payment-page">
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
        <Link 
          to="/" 
          style={{
            padding: "10px 20px",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            color: "#fff",
            textDecoration: "none",
            borderRadius: "8px",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            transition: "all 0.3s",
            fontSize: "14px",
            fontWeight: "500",
            whiteSpace: "nowrap",
            flexShrink: 0
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "rgba(255, 255, 255, 0.2)"
            e.target.style.borderColor = "rgba(255, 255, 255, 0.3)"
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "rgba(255, 255, 255, 0.1)"
            e.target.style.borderColor = "rgba(255, 255, 255, 0.2)"
          }}
        >
          ← Quay về trang chủ
        </Link>
        <h1 style={{ margin: 0 }}>Thanh toán đơn hàng</h1>
      </div>
      <div className="payment-grid">
        <div className="card">
          <h2>Thông tin người nhận</h2>
          <div className="fill-account-checkbox">
            <input
              type="checkbox"
              id="fillFromAccount"
              onChange={async (e) => {
                if (e.target.checked) {
                  await handleFillFromAccount()
                } else {
                  // Clear phone và address khi bỏ tích (không clear name)
                  setPhone("")
                  setAddress("")
                  setStatus(null)
                }
              }}
              disabled={isLoadingProfile || isPaying}
            />
            <label htmlFor="fillFromAccount">
              Sử dụng thông tin từ tài khoản
              {isLoadingProfile && <span className="loading-text"> (Đang tải...)</span>}
            </label>
          </div>
          <div className="section">
            <label>Họ và tên người nhận</label>
            <input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Nhập họ và tên người nhận"
            />
          </div>
          <div className="section">
            <label>Số điện thoại</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Nhập số điện thoại" />
          </div>
          <div className="section">
            <label>Địa chỉ giao hàng</label>
            <textarea rows={3} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Nhập địa chỉ" />
          </div>
          <div className="section">
            <label>Ghi chú</label>
            <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ví dụ: Giao giờ hành chính" />
          </div>

          <h2>Hình thức thanh toán</h2>
          <div className="section">
            <div className="radio-row">
              <input
                type="radio"
                id="cod"
                checked={paymentMethod === "cod"}
                onChange={() => setPaymentMethod("cod")}
              />
              <label htmlFor="cod">Thanh toán khi nhận hàng (COD)</label>
            </div>
            <div className="radio-row">
              <input
                type="radio"
                id="card"
                checked={paymentMethod === "card"}
                onChange={() => setPaymentMethod("card")}
              />
              <label htmlFor="card">Thanh toán bằng VNPAY</label>
            </div>
          </div>

          {paymentMethod === "card" && (
            <div className="vnpay-notice">
              <div className="vnpay-notice-icon">🔒</div>
              <div className="vnpay-notice-content">
                <div className="vnpay-notice-title">Thanh toán an toàn với VNPAY</div>
                <div className="vnpay-notice-text">
                  Bạn sẽ được chuyển tới cổng thanh toán VNPAY để xác thực và thanh toán một cách an toàn.
                </div>
              </div>
            </div>
          )}

          <div className="payment-actions">
            <button className="btn-primary" onClick={handlePay} disabled={isPaying}>
              {isPaying ? "Đang xử lý..." : "Xác nhận thanh toán"}
            </button>
            <button className="btn-secondary" type="button" onClick={handleCancelPayment} disabled={isPaying}>
              Hủy thanh toán
            </button>
          </div>

          {status && (
            <div className={`status ${status.type === "success" ? "success" : "error"}`}>
              {status.message}
            </div>
          )}
        </div>

        <div className="card">
          <h2>Đơn hàng của bạn</h2>
          <div className="order-items">
            {cartItems && cartItems.length > 0 ? (
              cartItems.map((item) => (
                <div key={item.id} className="order-item">
                  <div>
                    <div style={{ fontWeight: 700 }}>{item.product.product_name}</div>
                    <div className="info-text">Số lượng: {item.quantity}</div>
                  </div>
                  <div>{formatCurrency(calculateItemPrice(item) * item.quantity)}</div>
                </div>
              ))
            ) : (
              <p className="info-text">Giỏ hàng của bạn đang trống.</p>
            )}
          </div>
          <div className="summary-row">
            <span>Tạm tính</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="summary-row total">
            <span>Tổng thanh toán</span>
            <span>{formatCurrency(totals.total)}</span>
          </div>
          <p className="info-text">Trạng thái: <span className="badge">Chờ thanh toán</span></p>
          <p className="info-text">
            Sau khi thanh toán thành công, trạng thái sẽ tự động chuyển sang "Đã thanh toán".
          </p>
        </div>
      </div>
    </div>
  )
}




