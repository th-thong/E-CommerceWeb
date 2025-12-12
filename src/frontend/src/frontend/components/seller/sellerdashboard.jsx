"use client"
import { useState } from "react"
import Sidebar from "./sidebar"
import MainContent from "./main-content"
import "./sellerdashboard.css"

const SellerDashboard = () => {
  const [activeMenu, setActiveMenu] = useState("todo")
  const [products, setProducts] = useState([
    { id: 1, name: "Áo thun nam casual", price: 150000, status: "Đang bán", promoted: false },
    { id: 2, name: "Quần jean nam", price: 350000, status: "Đang bán", promoted: false },
    { id: 3, name: "Giày thể thao", price: 650000, status: "Chờ duyệt", promoted: false },
    { id: 4, name: "Áo khoác", price: 450000, status: "Chờ duyệt", promoted: false },
  ])

  const [orders, setOrders] = useState([
    {
      id: 1,
      orderCode: "DH001",
      customerName: "Nguyễn Văn A",
      phone: "0901234567",
      address: "123 Đường ABC, Quận 1, TP.HCM",
      status: "Chờ",
      createdAt: "05/11/2025 10:30",
      items: [
        { id: 1, name: "Áo thun nam casual", quantity: 2, price: 150000 },
        { id: 2, name: "Quần jean nam", quantity: 1, price: 350000 },
      ],
      total: 650000,
    },
    {
      id: 2,
      orderCode: "DH002",
      customerName: "Trần Thị B",
      phone: "0987654321",
      address: "456 Đường XYZ, Quận 2, TP.HCM",
      status: "Đang chuẩn bị",
      createdAt: "05/11/2025 11:00",
      items: [
        { id: 3, name: "Giày thể thao", quantity: 1, price: 650000 },
      ],
      total: 650000,
    },
    {
      id: 3,
      orderCode: "DH003",
      customerName: "Lê Văn C",
      phone: "0912345678",
      address: "789 Đường DEF, Quận 3, TP.HCM",
      status: "Chờ",
      createdAt: "05/11/2025 12:15",
      items: [
        { id: 4, name: "Áo khoác", quantity: 1, price: 450000 },
        { id: 1, name: "Áo thun nam casual", quantity: 3, price: 150000 },
      ],
      total: 900000,
    },
    {
      id: 4,
      orderCode: "DH004",
      customerName: "Phạm Thị D",
      phone: "0923456789",
      address: "321 Đường GHI, Quận 4, TP.HCM",
      status: "Đang giao hàng",
      createdAt: "04/11/2025 14:20",
      items: [
        { id: 2, name: "Quần jean nam", quantity: 2, price: 350000 },
      ],
      total: 700000,
    },
  ])

  return (
    <div className="seller-dashboard">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <MainContent
        activeMenu={activeMenu}
        orders={orders}
        setOrders={setOrders}
        products={products}
        setProducts={setProducts}
      />
    </div>
  )
}

export default SellerDashboard
