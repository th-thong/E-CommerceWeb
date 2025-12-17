"use client"
import { useState, useEffect } from "react"
import Sidebar from "@/components/Layout/Sidebar/Sidebar";
import MainContent from "@/components/Seller/main-content"
import { fetchMyShopOrders } from "@/api/orders"
import "./Dashboard.css"

const TOKEN_KEY = "auth_tokens"

const SellerDashboard = () => {
  const [activeMenu, setActiveMenu] = useState("todo")
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const savedTokens = localStorage.getItem(TOKEN_KEY)
        const tokens = savedTokens ? JSON.parse(savedTokens) : null
        const accessToken = tokens?.access || null
        if (!accessToken) {
          setOrders([])
          return
        }

        const data = await fetchMyShopOrders(accessToken)

        // API trả về danh sách ShopOrderDetail, map sang cấu trúc dùng cho UI
        const mappedOrders = (data || []).map((item, index) => {
          const priceNumber = Number.parseFloat(item.price) || 0
          const quantityNumber = item.quantity ?? 0
          const lineTotal = priceNumber * quantityNumber

          return {
            id: index + 1,
            orderCode: `DH-${item.order}`,
            customerName: `Khách hàng #${item.order}`,
            phone: "",
            address: "",
            status: "Chờ",
            createdAt: "",
            items: [
              {
                id: item.product,
                name: `Sản phẩm #${item.product}`,
                quantity: quantityNumber,
                price: priceNumber,
              },
            ],
            total: lineTotal,
          }
        })

        setOrders(mappedOrders)
      } catch (error) {
        console.error("Failed to load shop orders:", error)
      }
    }

    loadOrders()
  }, [])

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
