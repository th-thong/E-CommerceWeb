"use client"

import "../Seller/ProductManager/section.css"

const AdminContentModeration = () => {
  const reports = [
    {
      id: 1,
      type: "Bình luận",
      content: "Sản phẩm này tệ lắm, lừa đảo!",
      user: "Người dùng ẩn danh",
      target: "Áo thun nam casual",
      reason: "Ngôn từ tiêu cực",
      status: "Chờ xử lý",
    },
    {
      id: 2,
      type: "Đánh giá",
      content: "Spam link quảng cáo sang web khác",
      user: "user123",
      target: "Loa Bluetooth mini",
      reason: "Spam / Quảng cáo",
      status: "Chờ xử lý",
    },
  ]

  return (
    <div className="section">
      <div className="section-header">
        <h2>Kiểm Duyệt Nội Dung</h2>
        <span className="time-info">Xử lý báo cáo liên quan đến bình luận, đánh giá và nội dung vi phạm</span>
      </div>

      <div className="orders-section">
        <div className="orders-list">
          {reports.map((report) => (
            <div key={report.id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <span className="order-code">
                    #{report.id} - {report.type}
                  </span>
                  <span className="order-date">Lý do: {report.reason}</span>
                </div>
                <span className="status pending">{report.status}</span>
              </div>

              <div className="order-details">
                <div className="customer-info">
                  <p>
                    <strong>Người đăng:</strong> {report.user}
                  </p>
                  <p>
                    <strong>Đối tượng:</strong> {report.target}
                  </p>
                </div>

                <div className="order-items">
                  <strong>Nội dung bị báo cáo:</strong>
                  <p style={{ marginTop: 8, color: "rgba(255,255,255,0.85)" }}>{report.content}</p>
                </div>

                <div className="order-footer">
                  <div className="order-total">
                    <strong>Hành động khả dụng:</strong>
                  </div>
                  <div className="order-actions">
                    <button className="accept-btn">Giữ lại nội dung</button>
                    <button className="reject-btn">Ẩn / Xóa nội dung</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminContentModeration


