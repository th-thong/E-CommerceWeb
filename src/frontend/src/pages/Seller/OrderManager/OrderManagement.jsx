"use client"

import { useState } from "react"
import { rejectOrder, updateOrderStatus } from "@/api/orders"
import "./section.css"

const TOKEN_KEY = "auth_tokens"

const OrderManagement = ({ filterStatus, orders = [], setOrders, onOrdersUpdate }) => {
  const [isRejecting, setIsRejecting] = useState({})
  const [isAccepting, setIsAccepting] = useState({})
  const [isCompleting, setIsCompleting] = useState({})

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

  const handleAcceptOrder = async (order) => {
    const token = getToken()
    if (!token) {
      alert("Vui lòng đăng nhập lại")
      return
    }

    const detailId = order.detailId
    if (!detailId) {
      alert("Không tìm thấy thông tin đơn hàng")
      return
    }

    setIsAccepting({ [order.id]: true })

    try {
      // Gọi API để cập nhật trạng thái thành "confirmed" (Đang giao)
      await updateOrderStatus(detailId, { order_status: "confirmed" }, token)
      
      // Cập nhật state local
      setOrders(
        orders.map((o) => (o.id === order.id ? { ...o, status: "Đang giao" } : o)),
      )
      
      // Nếu có callback để reload danh sách, gọi nó
      if (onOrdersUpdate) {
        onOrdersUpdate()
      }
      
      alert("Đã nhận đơn hàng thành công")
    } catch (error) {
      console.error("Error accepting order:", error)
      alert(error.message || "Không thể nhận đơn hàng. Vui lòng thử lại.")
    } finally {
      setIsAccepting({ [order.id]: false })
    }
  }

  const handleRejectOrder = async (order) => {
    if (!window.confirm("Bạn có chắc chắn muốn từ chối đơn hàng này? Đơn hàng sẽ bị xóa hoàn toàn.")) {
      return
    }

    const token = getToken()
    if (!token) {
      alert("Vui lòng đăng nhập lại")
      return
    }

    // Lấy detail_id từ order object
    const detailId = order.detailId
    if (!detailId) {
      alert("Không tìm thấy thông tin đơn hàng")
      return
    }

    setIsRejecting({ [order.id]: true })

    try {
      await rejectOrder(detailId, token)
      // Xóa đơn hàng khỏi danh sách
      setOrders(orders.filter((o) => o.id !== order.id))
      
      // Nếu có callback để reload danh sách, gọi nó để đảm bảo đồng bộ với backend
      if (onOrdersUpdate) {
        onOrdersUpdate()
      }
      
      alert("Đã từ chối đơn hàng thành công")
    } catch (error) {
      console.error("Error rejecting order:", error)
      alert(error.message || "Không thể từ chối đơn hàng. Vui lòng thử lại.")
    } finally {
      setIsRejecting({ [order.id]: false })
    }
  }

  const handleCompletePreparation = async (order) => {
    const token = getToken()
    if (!token) {
      alert("Vui lòng đăng nhập lại")
      return
    }

    const detailId = order.detailId
    if (!detailId) {
      alert("Không tìm thấy thông tin đơn hàng")
      return
    }

    setIsCompleting({ [order.id]: true })

    try {
      // Gọi API để cập nhật trạng thái thành "shipped" (Đã giao)
      await updateOrderStatus(detailId, { order_status: "shipped" }, token)
      
      // Cập nhật state local
      setOrders(
        orders.map((o) => (o.id === order.id ? { ...o, status: "Đã giao" } : o)),
      )
      
      // Nếu có callback để reload danh sách, gọi nó
      if (onOrdersUpdate) {
        onOrdersUpdate()
      }
      
      alert("Đã hoàn tất chuẩn bị đơn hàng")
    } catch (error) {
      console.error("Error completing order:", error)
      alert(error.message || "Không thể hoàn tất đơn hàng. Vui lòng thử lại.")
    } finally {
      setIsCompleting({ [order.id]: false })
    }
  }

  // Lọc đơn hàng theo filterStatus
  const getFilteredOrders = () => {
    if (filterStatus === "orders-pending" || filterStatus === "orders") {
      return orders.filter((order) => order.status === "Đang chờ")
    } else if (filterStatus === "orders-preparing") {
      return orders.filter((order) => order.status === "Đang giao")
    } else if (filterStatus === "orders-shipping") {
      return orders.filter((order) => order.status === "Đã giao")
    }
    return []
  }

  const filteredOrders = getFilteredOrders()

  const getSectionTitle = () => {
    if (filterStatus === "orders-pending" || filterStatus === "orders") return "Đơn hàng đang chờ"
    if (filterStatus === "orders-preparing") return "Đơn hàng đang giao"
    if (filterStatus === "orders-shipping") return "Đơn hàng đã giao"
    return "Quản Lý Đơn Hàng"
  }

  return (
    <div className="section">
      <div className="section-header">
        <h2>{getSectionTitle()}</h2>
      </div>

      {filteredOrders.length > 0 ? (
        <div className="orders-section">
          <div className="orders-list">
            {filteredOrders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <span className="order-code">Mã đơn: {order.orderCode}</span>
                    <span className="order-date">{order.createdAt}</span>
                  </div>
                  <span className={`order-status status-${order.status.toLowerCase().replace(/\s/g, "-")}`}>
                    {order.status}
                  </span>
                </div>

                <div className="order-details">
                  <div className="customer-info">
                    <p>
                      <strong>Khách hàng:</strong> {order.customerName}
                    </p>
                    <p>
                      <strong>Số điện thoại:</strong> {order.phone}
                    </p>
                    <p>
                      <strong>Địa chỉ:</strong> {order.address}
                    </p>
                  </div>

                  <div className="order-items">
                    <strong>Sản phẩm:</strong>
                    <ul className="items-list">
                      {order.items.map((item) => (
                        <li key={item.id} className="order-item">
                          <span className="item-name">{item.name}</span>
                          <span className="item-quantity">x{item.quantity}</span>
                          <span className="item-price">
                            {(item.price * item.quantity).toLocaleString()}₫
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="order-footer">
                    <div className="order-total">
                      <strong>Tổng tiền: {order.total.toLocaleString()}₫</strong>
                    </div>
                    {order.status === "Đang chờ" && (
                      <div className="order-actions">
                        <button 
                          className="accept-btn" 
                          onClick={() => handleAcceptOrder(order)}
                          disabled={isAccepting[order.id]}
                        >
                          {isAccepting[order.id] ? "Đang xử lý..." : "Nhận đơn"}
                        </button>
                        <button 
                          className="reject-btn" 
                          onClick={() => handleRejectOrder(order)}
                          disabled={isRejecting[order.id]}
                        >
                          {isRejecting[order.id] ? "Đang xử lý..." : "Không nhận đơn"}
                        </button>
                      </div>
                    )}
                    {order.status === "Đang giao" && (
                      <button
                        className="complete-prepare-btn"
                        onClick={() => handleCompletePreparation(order)}
                        disabled={isCompleting[order.id]}
                      >
                        {isCompleting[order.id] ? "Đang xử lý..." : "Hoàn tất chuẩn bị"}
                      </button>
                    )}
                    {order.status === "Đã giao" && (
                      <span className="shipping-status">Đã giao hàng thành công</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="no-orders">
          <p>Không có đơn hàng nào</p>
        </div>
      )}
    </div>
  )
}

export default OrderManagement

