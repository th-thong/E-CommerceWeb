"use client"

import "./section.css"

const OrderManagement = ({ filterStatus, orders = [], setOrders }) => {

  const handleAcceptOrder = (orderId) => {
    setOrders(
      orders.map((order) => (order.id === orderId ? { ...order, status: "Đang giao" } : order)),
    )
  }

  const handleRejectOrder = (orderId) => {
    if (window.confirm("Bạn có chắc chắn muốn từ chối đơn hàng này?")) {
      setOrders(orders.filter((order) => order.id !== orderId))
    }
  }

  const handleCompletePreparation = (orderId) => {
    setOrders(
      orders.map((order) => (order.id === orderId ? { ...order, status: "Đã giao" } : order)),
    )
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
                        <button className="accept-btn" onClick={() => handleAcceptOrder(order.id)}>
                          Nhận đơn
                        </button>
                        <button className="reject-btn" onClick={() => handleRejectOrder(order.id)}>
                          Không nhận đơn
                        </button>
                      </div>
                    )}
                    {order.status === "Đang giao" && (
                      <button
                        className="complete-prepare-btn"
                        onClick={() => handleCompletePreparation(order.id)}
                      >
                        Hoàn tất chuẩn bị
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

