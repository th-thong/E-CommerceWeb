"use client"

import "../Seller/ProductManager/section.css"

const AdminUserManagement = () => {
  const users = [
    {
      id: 1,
      name: "Nguyễn Văn A",
      email: "user_a@example.com",
      role: "Người mua",
      status: "Hoạt động",
      violations: 0,
    },
    {
      id: 2,
      name: "Trần Thị B",
      email: "seller_b@example.com",
      role: "Người bán",
      status: "Tạm khóa",
      violations: 2,
    },
    {
      id: 3,
      name: "Shop C",
      email: "shop_c@example.com",
      role: "Người bán",
      status: "Hoạt động",
      violations: 1,
    },
  ]

  return (
    <div className="section">
      <div className="section-header">
        <h2>Quản Lý Tài Khoản Người Dùng</h2>
        <span className="time-info">Demo dữ liệu mẫu cho kênh Admin</span>
      </div>

      <div className="products-table">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Tên người dùng</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Lượt vi phạm</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <span className={`status ${user.status === "Hoạt động" ? "active" : "pending"}`}>{user.status}</span>
                </td>
                <td>{user.violations}</td>
                <td className="actions">
                  <button className="edit-btn">Xem chi tiết</button>
                  <button className="reject-btn" style={{ marginLeft: 8 }}>
                    Khóa / Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminUserManagement


