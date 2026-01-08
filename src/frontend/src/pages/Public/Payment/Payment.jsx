import { useMemo, useState } from "react"
import { useCart } from "@/contexts/CartContext"
import { createOrder } from "@/api/orders"
import { confirmCOD } from "@/api/payment"
import { useNavigate, Link } from "react-router-dom"
import "./Payment.css"

const SHIPPING_FEE = 30000

const formatCurrency = (v) => v.toLocaleString("vi-VN") + "đ"

const TOKEN_KEY = "auth_tokens"

export default function Payment() {
  const { cartItems, getTotalPrice, clearCart } = useCart()
  const navigate = useNavigate()

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

  const calculateItemPrice = (item) => {
    const price = item.variant?.price || item.product.base_price
    const discount = item.product.discount || 0
    return price * (1 - discount / 100)
  }

  const totals = useMemo(() => {
    const subtotal = getTotalPrice()
    return { subtotal, total: subtotal + SHIPPING_FEE }
  }, [cartItems, getTotalPrice])

  const validate = () => {
    if (!cartItems || cartItems.length === 0) return "Giỏ hàng đang trống, không thể thanh toán."
    if (!name.trim() || !phone.trim() || !address.trim()) return "Vui lòng điền đủ họ tên, SĐT, địa chỉ."
    if (paymentMethod === "card") {
      if (!cardNumber.trim() || !exp.trim() || !cvv.trim()) return "Vui lòng nhập đủ thông tin thẻ."
      if (cvv.length < 3 || cvv.length > 4) return "CVV không hợp lệ."
    }
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
      // 1. Tạo đơn hàng với items từ cart
      const orderItems = cartItems.map(item => ({
        product_id: item.product.product_id || item.product.id,
        variant_id: item.variant?.variant_id || item.variant?.id || null,
        quantity: item.quantity
      }))

      const orderData = {
        items: orderItems,
        payment_type: paymentMethod === "cod" ? "COD" : "VNPAY"
      }

      const orderResponse = await createOrder(orderData, token)
      const orderId = orderResponse.order_id

      // 2. Nếu là COD, xác nhận thanh toán COD
      if (paymentMethod === "cod") {
        await confirmCOD(orderId, token)
        
        // Xóa giỏ hàng sau khi thanh toán thành công
        clearCart()
        
        setStatus({ 
          type: "success", 
          message: "Thanh toán thành công. Đơn hàng đã chuyển sang trạng thái 'Chờ xác nhận'." 
        })
      } else {
        // VNPAY - redirect đến payment URL
        if (orderResponse.payment_url) {
          window.location.href = orderResponse.payment_url
          return
        } else {
          setStatus({ type: "error", message: "Không thể lấy URL thanh toán" })
        }
      }
    } catch (error) {
      console.error("Payment error:", error)
      setStatus({ 
        type: "error", 
        message: error.message || "Thanh toán thất bại. Vui lòng thử lại." 
      })
    } finally {
      setIsPaying(false)
    }
  }

  const handleCancelPayment = () => {
    setStatus({ type: "error", message: "Giao dịch bị hủy. Đơn hàng giữ trạng thái 'Chờ thanh toán'." })
  }

  return (
    <div className="payment-page">
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: 16 }}>
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
            whiteSpace: "nowrap"
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
          <div className="section">
            <label>Họ tên</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập họ tên" />
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
              <label htmlFor="card">Thẻ ngân hàng / Thẻ quốc tế</label>
            </div>
          </div>

          {paymentMethod === "card" && (
            <div className="section">
              <label>Số thẻ</label>
              <input
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="1234 5678 9012 3456"
              />
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <input value={exp} onChange={(e) => setExp(e.target.value)} placeholder="MM/YY" />
                <input value={cvv} onChange={(e) => setCvv(e.target.value)} placeholder="CVV" />
              </div>
              <p className="info-text">Bạn sẽ được chuyển tới cổng thanh toán để xác thực.</p>
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
          <div className="summary-row">
            <span>Phí vận chuyển</span>
            <span>{formatCurrency(SHIPPING_FEE)}</span>
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




