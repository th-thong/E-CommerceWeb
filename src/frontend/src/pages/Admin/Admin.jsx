import BackgroundAnimation from "@/components/Common/BackgroundAnimation/BackgroundAnimation"
import Navbar from "@/components/Layout/Navbar/Navbar"
import AdminSidebar from "@/components/Layout/AdminSidebar/AdminSidebar"
import AdminMainContent from "@/components/Admin/AdminMainContent"
import { useState } from "react"

const Admin = () => {
  const [activeMenu, setActiveMenu] = useState("overview")

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

