"use client"

import "./AdminSidebar.css"

const AdminSidebar = ({ activeMenu, setActiveMenu }) => {
  const mainItems = [
    { id: "overview", label: "Tổng quan hệ thống", icon: "🛡️" },
    { id: "users", label: "Quản lý tài khoản", icon: "👥" },
    { id: "products", label: "Duyệt sản phẩm", icon: "🛒" },
    { id: "content", label: "Kiểm duyệt nội dung", icon: "📝" },
  ]

  return (
    <aside className="sidebar admin-sidebar">
      <div className="sidebar-header">
        <h2>Kênh Admin ShopLiteX</h2>
      </div>

      <div className="sidebar-menu">
        <div className="menu-section">
          <h3 className="menu-title">Điều Hành</h3>
          <ul className="menu-list">
            {mainItems.map((item) => (
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
      </div>
    </aside>
  )
}

export default AdminSidebar


