import { useMemo, useState } from "react"
import "./Payment.css"

const mockOrder = {
  id: "DH-2025-0001",
  items: [
    { name: "Tai nghe không dây", qty: 1, price: 850000 },
    { name: "Áo thun nam casual", qty: 2, price: 150000 },
  ],
  shipping: 30000,
  customer: {
    name: "Nguyễn Văn A",
    phone: "0901234567",
    address: "123 Lê Lợi, Quận 1, TP.HCM",
  },
}

const formatCurrency = (v) => v.toLocaleString("vi-VN") + "đ"

export default function Payment() {
  const [paymentMethod, setPaymentMethod] = useState("cod")
  const [name, setName] = useState(mockOrder.customer.name)
  const [phone, setPhone] = useState(mockOrder.customer.phone)
  const [address, setAddress] = useState(mockOrder.customer.address)
  const [cardNumber, setCardNumber] = useState("")
  const [exp, setExp] = useState("")
  const [cvv, setCvv] = useState("")
  const [note, setNote] = useState("")
  const [status, setStatus] = useState(null) // { type: 'success' | 'error', message: string }
  const [isPaying, setIsPaying] = useState(false)

  const totals = useMemo(() => {
    const subtotal = mockOrder.items.reduce((sum, i) => sum + i.price * i.qty, 0)
    return { subtotal, total: subtotal + mockOrder.shipping }
  }, [])

  const validate = () => {
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
    setIsPaying(true)
    setStatus(null)
    // Giả lập gọi gateway; thực tế sẽ redirect hoặc open popup
    await new Promise((r) => setTimeout(r, 1200))
    setIsPaying(false)
    // Giả lập thành công
    setStatus({ type: "success", message: "Thanh toán thành công. Đơn hàng đã chuyển sang trạng thái 'Đã thanh toán'." })
  }

  const handleCancelPayment = () => {
    setStatus({ type: "error", message: "Giao dịch bị hủy. Đơn hàng giữ trạng thái 'Chờ thanh toán'." })
  }

  return (
    <div className="payment-page">
      <h1 style={{ marginBottom: 16 }}>Thanh toán đơn hàng</h1>
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
          <h2>Đơn hàng #{mockOrder.id}</h2>
          <div className="order-items">
            {mockOrder.items.map((item, idx) => (
              <div key={idx} className="order-item">
                <div>
                  <div style={{ fontWeight: 700 }}>{item.name}</div>
                  <div className="info-text">Số lượng: {item.qty}</div>
                </div>
                <div>{formatCurrency(item.price * item.qty)}</div>
              </div>
            ))}
          </div>
          <div className="summary-row">
            <span>Tạm tính</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Phí vận chuyển</span>
            <span>{formatCurrency(mockOrder.shipping)}</span>
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




