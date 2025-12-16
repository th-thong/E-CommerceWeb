import "./AdminDashboard.css"
import { useNavigate } from "react-router-dom"

const AdminDashboard = () => {
  const navigate = useNavigate()

  const handleGoToUserManager = () => {
    navigate("/admin/users")
  }

  const handleGoToProductReview = () => {
    navigate("/admin/products")
  }

  const handleGoToContentModeration = () => {
    navigate("/admin/content")
  }

  return (
    <main className="admin-page">
      <section className="admin-hero">
        <div className="admin-hero-text">
          <h1>Trang Quản Trị Hệ Thống</h1>
          <p>
            Kênh Admin chịu trách nhiệm giám sát toàn bộ nền tảng ShopLiteX: quản lý tài khoản người dùng, duyệt
            sản phẩm đăng bán và kiểm duyệt mọi nội dung hiển thị trên website.
          </p>
        </div>
      </section>

      <section className="admin-grid">
        <div className="admin-card">
          <h2>Quản lý tài khoản người dùng</h2>
          <p>
            Xem, tìm kiếm và theo dõi tình trạng tài khoản của người mua và người bán. Thực hiện các thao tác xử lý
            khi phát hiện hành vi vi phạm.
          </p>
          <ul>
            <li>Xem danh sách tài khoản người dùng</li>
            <li>Khóa / mở khóa hoặc xóa tài khoản vi phạm</li>
            <li>Phân quyền người mua, người bán để duy trì hoạt động ổn định</li>
          </ul>
          <button className="admin-card-button" onClick={handleGoToUserManager}>
            Vào quản lý tài khoản
          </button>
        </div>

        <div className="admin-card">
          <h2>Duyệt sản phẩm đăng bán</h2>
          <p>
            Kiểm tra và phê duyệt các sản phẩm mới được người bán đăng tải để đảm bảo tuân thủ chính sách và chất
            lượng nội dung.
          </p>
          <ul>
            <li>Danh sách sản phẩm chờ duyệt</li>
            <li>Xem chi tiết thông tin sản phẩm, người bán</li>
            <li>Phê duyệt hoặc từ chối với lý do cụ thể</li>
          </ul>
          <button className="admin-card-button" onClick={handleGoToProductReview}>
            Vào duyệt sản phẩm
          </button>
        </div>

        <div className="admin-card">
          <h2>Kiểm duyệt nội dung trên web</h2>
          <p>
            Giám sát bình luận, đánh giá và các nội dung do người dùng tạo ra; kịp thời ẩn hoặc xóa các nội dung
            không phù hợp để bảo vệ cộng đồng.
          </p>
          <ul>
            <li>Theo dõi bình luận, đánh giá có báo cáo vi phạm</li>
            <li>Ẩn / xóa nội dung không phù hợp với tiêu chuẩn cộng đồng</li>
            <li>Lưu lại lịch sử xử lý để phục vụ tra soát sau này</li>
          </ul>
          <button className="admin-card-button" onClick={handleGoToContentModeration}>
            Vào kiểm duyệt nội dung
          </button>
        </div>
      </section>
    </main>
  )
}

export default AdminDashboard


