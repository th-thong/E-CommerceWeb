import BackgroundAnimation from "@/components/Common/BackgroundAnimation/BackgroundAnimation"
import Navbar from "@/components/Layout/Navbar/Navbar"
import AdminSidebar from "@/components/Layout/AdminSidebar/AdminSidebar"
import AdminMainContent from "@/components/Admin/AdminMainContent"
import "@/pages/Seller/Dashboard/Dashboard.css"
<<<<<<< HEAD
import "./AdminDashboard.css"
import { useState, useEffect } from "react"
import { getProfile } from "@/api/auth"
import { Link, useNavigate } from "react-router-dom"

const Admin = () => {
  const navigate = useNavigate()
  const [activeMenu, setActiveMenu] = useState("users")
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
=======
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
>>>>>>> c6c20fd1348c222349e24d1a49baedfa050e2421

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

  useEffect(() => {
    const checkAdminAccess = async () => {
      const token = getToken()
      
      if (!token) {
        // Chưa đăng nhập -> chuyển về trang chủ với tham số để mở modal đăng nhập
        navigate("/?login=true", { replace: true })
        return
      }

      try {
        const profile = await getProfile(token)
        // Kiểm tra nếu user là admin (role === "admin" hoặc is_staff === true)
        if (profile.role === "admin" || profile.is_staff === true) {
          setHasAccess(true)
          setLoading(false)
        } else {
          setErrorMessage("Bạn không có quyền truy cập vào trang này")
          setHasAccess(false)
          setLoading(false)
        }
      } catch (err) {
        setErrorMessage("Không thể xác thực quyền truy cập")
        setHasAccess(false)
        setLoading(false)
      }
    }

    checkAdminAccess()
  }, [navigate])

  // Nếu chưa đăng nhập, không render gì (đang redirect)
  const token = getToken()
  if (!token) {
    return null
  }

  // Loading state
  if (loading) {
    return (
      <div className="container">
        <BackgroundAnimation />
        <Navbar />
        <div className="access-denied-container">
          <div className="access-denied-card">
            <span className="access-icon">⏳</span>
            <h2>Đang kiểm tra quyền truy cập...</h2>
          </div>
        </div>
      </div>
    )
  }

  // Access denied
  if (!hasAccess) {
    return (
      <div className="container">
        <BackgroundAnimation />
        <Navbar />
        <div className="access-denied-container">
          <div className="access-denied-card">
            <span className="access-icon">🚫</span>
            <h2>Truy cập bị từ chối</h2>
            <p>{errorMessage}</p>
            <Link to="/" className="back-home-btn">
              ← Quay về trang chủ
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Admin has access
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
