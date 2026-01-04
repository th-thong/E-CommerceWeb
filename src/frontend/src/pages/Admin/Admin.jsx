import BackgroundAnimation from "@/components/Common/BackgroundAnimation/BackgroundAnimation"
import Navbar from "@/components/Layout/Navbar/Navbar"
import AdminSidebar from "@/components/Layout/AdminSidebar/AdminSidebar"
import AdminMainContent from "@/components/Admin/AdminMainContent"
import "@/pages/Seller/Dashboard/Dashboard.css"
import { useState, useEffect } from "react"
import { getProfile } from "@/api/auth"
import { useNavigate } from "react-router-dom"

const TOKEN_KEY = "auth_tokens"

const Admin = () => {
  const [activeMenu, setActiveMenu] = useState("users")
  const [isCheckingPermission, setIsCheckingPermission] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const checkAdminPermission = async () => {
      try {
        setIsCheckingPermission(true)
        
        // Kiểm tra token
        const savedTokens = localStorage.getItem(TOKEN_KEY)
        if (!savedTokens) {
          alert("Chỉ có tài khoản admin mới được phép vào kênh này !")
          navigate("/")
          return
        }

        const tokens = JSON.parse(savedTokens)
        const accessToken = tokens?.access

        if (!accessToken) {
          alert("Chỉ có tài khoản admin mới được phép vào kênh này !")
          navigate("/")
          return
        }

        // Lấy profile để kiểm tra role
        const profile = await getProfile(accessToken)
        
        // Kiểm tra xem user có phải admin không
        if (profile.role !== "Admin") {
          alert("Chỉ có tài khoản admin mới được phép vào kênh này !")
          navigate("/")
          return
        }

        // Nếu là admin, cho phép truy cập
        setIsAdmin(true)
        setIsCheckingPermission(false)
      } catch (error) {
        console.error("Failed to check admin permission:", error)
        alert("Chỉ có tài khoản admin mới được phép vào kênh này !")
        navigate("/")
      }
    }

    checkAdminPermission()
  }, [navigate])

  if (isCheckingPermission) {
    return (
      <div className="container">
        <BackgroundAnimation />
        <Navbar />
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          minHeight: "60vh",
          color: "#fff",
          fontSize: "18px"
        }}>
          Đang kiểm tra quyền truy cập...
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="container">
      <BackgroundAnimation />
      <Navbar />
      <div className="seller-dashboard">
        <AdminSidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
        <AdminMainContent activeMenu={activeMenu} />
      </div>
    </div>
  )
}

export default Admin

