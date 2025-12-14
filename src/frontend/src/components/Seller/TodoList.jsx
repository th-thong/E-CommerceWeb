import "./todo.css"

const TodoSection = ({ orders = [], products = [] }) => {
  // Tính toán số liệu từ orders
  const pendingOrdersCount = orders.filter((order) => order.status === "Chờ").length
  const preparingOrdersCount = orders.filter((order) => order.status === "Đang chuẩn bị").length
  const shippingOrdersCount = orders.filter((order) => order.status === "Đang giao hàng").length

  // Đếm sản phẩm chờ duyệt
  const pendingProductsCount = products.filter((product) => product.status === "Chờ duyệt").length

  const todoItems = [
    { label: "Chờ lấy hàng", count: pendingOrdersCount },
    { label: "Đã chuẩn bị", count: preparingOrdersCount },
    { label: "Đang giao", count: shippingOrdersCount },
    { label: "Sản phẩm chờ duyệt", count: pendingProductsCount },
  ]

  return (
    <div className="section">
      <div className="section-header">
        <h2>Danh sách cần làm</h2>
      </div>
      <div className="todo-grid">
        {todoItems.map((item, idx) => (
          <div key={idx} className="todo-card">
            <div className="todo-count">{item.count}</div>
            <div className="todo-label">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TodoSection