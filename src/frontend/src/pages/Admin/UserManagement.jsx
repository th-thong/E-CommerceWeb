"use client"

import { useState, useEffect } from "react"
import { getAllUsers, getPendingUsers, updateUser, deleteUser } from "@/api/admin"
import "../Seller/ProductManager/section.css"

const AdminUserManagement = () => {
  const [users, setUsers] = useState([])
  const [pendingUsers, setPendingUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("all") // "all" hoặc "pending"
  const [actionLoading, setActionLoading] = useState(null) // userId đang xử lý
  const [detailUser, setDetailUser] = useState(null) // Thông tin người bán chờ duyệt

  const getToken = () => {
    const saved = localStorage.getItem("auth_tokens")
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

  // Lấy danh sách users
  const fetchUsers = async () => {
    const token = getToken()
    if (!token) {
      setError("Vui lòng đăng nhập với tài khoản Admin để sử dụng chức năng này.")
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [allUsersData, pendingUsersData] = await Promise.all([
        getAllUsers(token),
        getPendingUsers(token),
      ])
      setUsers(allUsersData || [])
      setPendingUsers(pendingUsersData || [])
    } catch (err) {
      console.error("Fetch users error:", err)
      if (err.message?.includes("401")) {
        setError("Bạn không có quyền truy cập. Vui lòng đăng nhập với tài khoản Admin.")
      } else if (err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")) {
        setError("Không thể kết nối đến server. Vui lòng kiểm tra backend đã chạy chưa.")
      } else {
        setError(err.message || "Không thể tải danh sách người dùng.")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Chuyển đổi status sang tiếng Việt
  const getStatusLabel = (status) => {
    switch (status) {
      case "active":
        return "Hoạt động"
      case "banned":
        return "Đã khóa"
      case "pending":
        return "Chờ duyệt"
      default:
        return status
    }
  }

  // Chuyển đổi role sang tiếng Việt
  const getRoleLabel = (role) => {
    switch (role) {
      case "customer":
        return "Người mua"
      case "seller":
        return "Người bán"
      case "admin":
        return "Quản trị viên"
      default:
        return role
    }
  }

  // Xử lý phê duyệt người bán
  const handleApprove = async (userId) => {
    if (!window.confirm("Bạn có chắc muốn phê duyệt người dùng này trở thành người bán?")) return
    setActionLoading(userId)
    try {
      const token = getToken()
      // Backend require đúng tên group (Django Group name) -> "Seller"
      await updateUser(userId, { role: "Seller", status: "active" }, token)
      alert("Đã phê duyệt thành công!")
      fetchUsers()
    } catch (err) {
      alert("Lỗi: " + (err.message || "Không thể phê duyệt"))
    } finally {
      setActionLoading(null)
    }
  }

  // Xử lý khóa tài khoản
  const handleBan = async (userId) => {
    if (!window.confirm("Bạn có chắc muốn khóa tài khoản này?")) return
    setActionLoading(userId)
    try {
      const token = getToken()
      await updateUser(userId, { status: "banned" }, token)
      alert("Đã khóa tài khoản!")
      fetchUsers()
    } catch (err) {
      alert("Lỗi: " + (err.message || "Không thể khóa tài khoản"))
    } finally {
      setActionLoading(null)
    }
  }

  // Xử lý mở khóa tài khoản
  const handleUnban = async (userId) => {
    if (!window.confirm("Bạn có chắc muốn mở khóa tài khoản này?")) return
    setActionLoading(userId)
    try {
      const token = getToken()
      await updateUser(userId, { status: "active" }, token)
      alert("Đã mở khóa tài khoản!")
      fetchUsers()
    } catch (err) {
      alert("Lỗi: " + (err.message || "Không thể mở khóa tài khoản"))
    } finally {
      setActionLoading(null)
    }
  }

  // Xử lý xóa tài khoản
  const handleDelete = async (userId) => {
    if (!window.confirm("Bạn có chắc muốn XÓA VĨNH VIỄN tài khoản này? Hành động này không thể hoàn tác!")) return
    setActionLoading(userId)
    try {
      const token = getToken()
      await deleteUser(userId, token)
      alert("Đã xóa tài khoản!")
      fetchUsers()
    } catch (err) {
      alert("Lỗi: " + (err.message || "Không thể xóa tài khoản"))
    } finally {
      setActionLoading(null)
    }
  }

  const displayUsers = activeTab === "all" ? users : pendingUsers

  return (
    <div className="section">
      <div className="section-header">
        <h2>Quản Lý Tài Khoản Người Dùng</h2>
        <span className="time-info">
          {activeTab === "all" 
            ? `Tổng: ${users.length} người dùng` 
            : `${pendingUsers.length} người dùng chờ duyệt`}
        </span>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: 16, display: "flex", gap: 12 }}>
        <button
          className={activeTab === "all" ? "accept-btn" : "edit-btn"}
          onClick={() => setActiveTab("all")}
        >
          Tất cả người dùng ({users.length})
        </button>
        <button
          className={activeTab === "pending" ? "accept-btn" : "edit-btn"}
          onClick={() => setActiveTab("pending")}
        >
          Chờ duyệt người bán ({pendingUsers.length})
        </button>
      </div>

      {loading && <p style={{ color: "#fff", padding: 20 }}>Đang tải...</p>}
      {error && <p style={{ color: "#ff6b6b", padding: 20 }}>{error}</p>}

      {!loading && !error && (
        <div className="products-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên người dùng</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {displayUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: 20 }}>
                    {activeTab === "all" ? "Không có người dùng nào" : "Không có yêu cầu chờ duyệt"}
                  </td>
                </tr>
              ) : (
                displayUsers.map((user) => (
                  <tr key={user.user_id}>
                    <td>{user.user_id}</td>
                    <td>{user.user_name}</td>
                    <td>{user.email}</td>
                    <td>{getRoleLabel(user.role)}</td>
                    <td>
                      <span
                        className={`status ${
                          user.status === "active"
                            ? "active"
                            : user.status === "banned"
                            ? "rejected"
                            : "pending"
                        }`}
                      >
                        {getStatusLabel(user.status)}
                      </span>
                    </td>
                    <td className="actions">
                      {actionLoading === user.user_id ? (
                        <span style={{ color: "#aaa" }}>Đang xử lý...</span>
                      ) : (
                        <>
                          {/* Nút xem chi tiết (dành cho pending sellers) */}
                          {activeTab === "pending" && (
                            <button
                              className="edit-btn"
                              onClick={() => setDetailUser(user)}
                              style={{ marginRight: 8 }}
                            >
                              Xem chi tiết
                            </button>
                          )}

                          {/* Nút phê duyệt (chỉ hiện cho pending users) */}
                          {activeTab === "pending" && user.status === "pending" && (
                            <button
                              className="accept-btn"
                              onClick={() => handleApprove(user.user_id)}
                            >
                              Phê duyệt
                            </button>
                          )}

                          {/* Nút khóa/mở khóa */}
                          {user.status === "banned" ? (
                            <button
                              className="edit-btn"
                              onClick={() => handleUnban(user.user_id)}
                              style={{ marginLeft: 8 }}
                            >
                              Mở khóa
                            </button>
                          ) : (
                            <button
                              className="reject-btn"
                              onClick={() => handleBan(user.user_id)}
                              style={{ marginLeft: 8 }}
                            >
                              Khóa
                            </button>
                          )}

                          {/* Nút xóa */}
                          <button
                            className="reject-btn"
                            onClick={() => handleDelete(user.user_id)}
                            style={{ marginLeft: 8, backgroundColor: "#8b0000" }}
                          >
                            Xóa
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal xem chi tiết người bán */}
      {detailUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
          onClick={() => setDetailUser(null)}
        >
          <div
            style={{
              background: "#111827",
              color: "#e5e7eb",
              padding: 24,
              borderRadius: 12,
              width: "480px",
              maxWidth: "90%",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Thông tin người bán</h3>
              <button
                className="reject-btn"
                onClick={() => setDetailUser(null)}
                style={{ backgroundColor: "#374151" }}
              >
                Đóng
              </button>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <div><strong>ID:</strong> {detailUser.user_id}</div>
              <div><strong>Tên người dùng:</strong> {detailUser.user_name || detailUser.username || "—"}</div>
              <div><strong>Email:</strong> {detailUser.email || "—"}</div>
              <div>
                <strong>Số điện thoại:</strong>{" "}
                {detailUser.shop_phone_number || detailUser.phone || detailUser.phone_number || "—"}
              </div>
              <div><strong>Vai trò yêu cầu:</strong> {getRoleLabel(detailUser.role)}</div>
              <div><strong>Trạng thái:</strong> {getStatusLabel(detailUser.status)}</div>

              {/* Thông tin cửa hàng (nếu backend cung cấp) */}
              <div><strong>Tên cửa hàng:</strong> {detailUser.shop_name || detailUser.store_name || detailUser.seller_name || "—"}</div>
              <div><strong>Mô tả cửa hàng:</strong> {detailUser.shop_description || detailUser.store_description || "—"}</div>
              <div><strong>Địa chỉ cửa hàng:</strong> {detailUser.shop_address || detailUser.address || "—"}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUserManagement
