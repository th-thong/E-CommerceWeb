import "./admin-main-content.css"
import AdminUserManagement from "@/pages/Admin/UserManagement"
import AdminProductReview from "@/pages/Admin/ProductReview"
import AdminContentModeration from "@/pages/Admin/ContentModeration"

const AdminMainContent = ({ activeMenu }) => {
  return (
    <main className="main-content">
      {activeMenu === "users" && <AdminUserManagement />}
      {activeMenu === "products" && <AdminProductReview />}
      {activeMenu === "content" && <AdminContentModeration />}
    </main>
  )
}

export default AdminMainContent


