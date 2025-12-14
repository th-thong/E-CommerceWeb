"use client"
import "./Sidebar.css"
import { Link } from "react-router-dom"

const Sidebar = ({ activeMenu, setActiveMenu }) => {
  const menuItems = [
    { id: "todo", label: "Danh sách cần làm", icon: "📋" },
    { id: "products", label: "Quản Lý Sản Phẩm", icon: "📦" },
    { id: "analytics", label: "Thống kê bán hàng", icon: "📊" },
    { id: "services", label: "Dịch vụ hiện thị", icon: "🎯" },
    { id: "kol", label: "Tăng đơn cùng KOL", icon: "⭐" },
    { id: "livestream", label: "Livestream", icon: "📹" },
    { id: "marketing", label: "Kênh Marketing", icon: "📢" },
    { id: "orders", label: "Đơn hàng", icon: "🛍️" },
  ]

  const categories = [
    {
      title: "Quản Lý Đơn Hàng",
      items: [
        { label: "Đơn hàng đang chờ", id: "orders-pending" },
        { label: "Đơn hàng đang chuẩn bị", id: "orders-preparing" },
        { label: "Đơn hàng đang giao", id: "orders-shipping" },
      ],
    },
    {
      title: "Quản Lý Sản Phẩm",
      items: ["Tất cả sản phẩm", "Thêm sản phẩm", "Chỉnh sửa sản phẩm", "Sản phẩm chờ duyệt"],
    },
    {
      title: "Chăm sóc khách hàng",
      items: ["Quản lý Chat", "Quản lý đánh giá", "Tài chính"],
    },
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
          <h2>ShopLiteX Bán Hàng</h2>
        </Link>
      </div>

      {/* Main Menu */}
      <div className="sidebar-menu">
        <div className="menu-section">
          <h3 className="menu-title">Tổng Quan</h3>
          <ul className="menu-list">
            {menuItems.slice(0, 3).map((item) => (
              <li key={item.id}>
                <button
                  className={`menu-item ${activeMenu === item.id ? "active" : ""}`}
                  onClick={() => setActiveMenu(item.id)}
                >
                  <span className="menu-icon">{item.icon}</span>
                  <span className="menu-label">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Categories */}
        {categories.map((category, idx) => (
          <div key={idx} className="menu-section">
            <h3 className="menu-title">{category.title}</h3>
            <ul className="menu-list">
              {category.items.map((item) => (
                <li key={item.id}>
                  <button
                    className={`menu-item submenu-item ${activeMenu === item.id ? "active" : ""}`}
                    onClick={() => setActiveMenu(item.id)}
                  >
                    <span className="menu-label">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  )
}

export default Sidebar
