"use client"
import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import Sidebar from "@/components/Layout/Sidebar/Sidebar";
import MainContent from "@/components/Seller/main-content"
import { fetchMyShopOrders } from "@/api/orders"
import { getProfile } from "@/api/auth"
import "./Dashboard.css"

const TOKEN_KEY = "auth_tokens"

const SellerDashboard = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeMenu, setActiveMenu] = useState("todo")
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [isCheckingPermission, setIsCheckingPermission] = useState(true)
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [isSeller, setIsSeller] = useState(false)

  // Check query param để set activeMenu (ví dụ: /seller?menu=feedback-management)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const menuParam = searchParams.get('menu')
    if (menuParam === 'feedback-management') {
      setActiveMenu('feedback-management')
      // Xóa query param sau khi set để URL sạch
      navigate(location.pathname, { replace: true })
    }
  }, [location.search, location.pathname, navigate])

  useEffect(() => {
    const checkSellerPermission = async () => {
      try {
        const savedTokens = localStorage.getItem(TOKEN_KEY)
        const tokens = savedTokens ? JSON.parse(savedTokens) : null
        const accessToken = tokens?.access || null
        
        if (!accessToken) {
          // Chưa đăng nhập, chuyển về trang chủ
          navigate("/")
          return
        }

        // Lấy profile để kiểm tra role
        const profile = await getProfile(accessToken)
        
        // Kiểm tra xem user có phải seller không
        if (profile.role !== "Seller") {
          // Nếu không phải seller, hiển thị popup
          setIsSeller(false)
          setShowPermissionModal(true)
          setIsCheckingPermission(false)
          return
        }

        // Nếu là seller, tiếp tục load dữ liệu
        setIsSeller(true)
        setIsCheckingPermission(false)
        loadOrders(accessToken)
      } catch (error) {
        console.error("Failed to check seller permission:", error)
        // Nếu có lỗi, hiển thị popup
        setShowPermissionModal(true)
        setIsCheckingPermission(false)
      }
    }

    const loadOrders = async (accessToken) => {
      try {
        const data = await fetchMyShopOrders(accessToken)
        
        // Debug: Log raw data from API
        console.log('[API Response] Raw data from backend:', data)
        if (data && data.length > 0) {
          console.log('[API Response] First item:', data[0])
          console.log('[API Response] First item price:', data[0].price)
          console.log('[API Response] First item subtotal:', data[0].subtotal)
          console.log('[API Response] First item quantity:', data[0].quantity)
        }

        // API trả về danh sách ShopOrderDetail (dữ liệu thật từ backend)
        const mappedOrders = (data || []).map((item, index) => {
          // Map trạng thái từ backend sang nhãn tiếng Việt dùng trong UI
          const backendStatus = (item.order_status || "").toLowerCase()
          // pending -> Đang chờ, confirmed -> Đang giao, shipped -> Đã giao
          let displayStatus = "Đang chờ"
          if (backendStatus === "confirmed") displayStatus = "Đang giao"
          else if (backendStatus === "shipped") displayStatus = "Đã giao"

          const quantityNumber = item.quantity ?? 0
          const priceNumber = Number.parseFloat(item.price) || 0
          const subtotalFromBackend = item.subtotal !== undefined && item.subtotal !== null
            ? Number.parseFloat(item.subtotal)
            : null
          
          // Ưu tiên dùng price từ backend (đã là tổng tiền dòng)
          // Chỉ dùng subtotal nếu nó hợp lý (không quá lớn so với price)
          // Tránh trường hợp subtotal bị nhân 2 lần từ đơn hàng cũ
          let subtotalNumber = priceNumber // Mặc định dùng price
          if (subtotalFromBackend !== null) {
            // Nếu subtotal gần bằng price (sai số < 10%), thì dùng subtotal
            // Nếu subtotal lớn hơn price nhiều (có thể bị nhân 2 lần), thì dùng price
            const diff = Math.abs(subtotalFromBackend - priceNumber) / priceNumber
            if (diff < 0.1) {
              subtotalNumber = subtotalFromBackend
            } else {
              // subtotal có vẻ sai, dùng price thay thế
              console.warn('[Order Mapping] subtotal seems incorrect, using price instead', {
                price: priceNumber,
                subtotal: subtotalFromBackend,
                diff: diff
              })
              subtotalNumber = priceNumber
            }
          }

          // Tính đơn giá từ tổng tiền
          const unitPrice = quantityNumber > 0 ? subtotalNumber / quantityNumber : 0

          // Debug log - in từng giá trị riêng để dễ đọc
          console.log('[Order Mapping - loadOrders] Item ID:', item.id)
          console.log('  Product:', item.product_name)
          console.log('  Quantity:', quantityNumber)
          console.log('  priceFromBackend:', priceNumber)
          console.log('  subtotalFromBackend:', item.subtotal)
          console.log('  calculatedSubtotal:', subtotalNumber)
          console.log('  calculatedUnitPrice:', unitPrice)
          console.log('  finalTotal (unitPrice * quantity):', unitPrice * quantityNumber)
          console.log('---')

          return {
            id: index + 1,
            detailId: item.id, // Lưu detail_id để dùng cho API reject/update
            orderCode: `DH-${item.order_id ?? item.order ?? ""}`,
            customerName: item.customer_name || item.customer_email || "Khách hàng",
            phone: "", // Chưa có field phone trong serializer
            address: "", // Chưa có field address trong serializer
            status: displayStatus,
            createdAt: item.created_at || "",
            items: [
              {
                id: item.product,
                name: item.product_name || `Sản phẩm #${item.product}`,
                quantity: quantityNumber,
                // Lưu đơn giá (tính từ tổng tiền / số lượng) để hiển thị bên cạnh x10
                price: unitPrice,
              },
            ],
            // Tổng tiền = đơn giá × số lượng (để đảm bảo tính toán đúng)
            total: unitPrice * quantityNumber,
          }
        })

        setOrders(mappedOrders)
      } catch (error) {
        console.error("Failed to load shop orders:", error)
      }
    }

    checkSellerPermission()
  }, [navigate])

  // Hàm reload đơn hàng sau khi cập nhật
  const reloadOrders = async () => {
    try {
      const savedTokens = localStorage.getItem(TOKEN_KEY)
      const tokens = savedTokens ? JSON.parse(savedTokens) : null
      const accessToken = tokens?.access || null
      
      if (!accessToken) {
        return
      }

      const data = await fetchMyShopOrders(accessToken)

      // API trả về danh sách ShopOrderDetail (dữ liệu thật từ backend)
      const mappedOrders = (data || []).map((item, index) => {
        // Map trạng thái từ backend sang nhãn tiếng Việt dùng trong UI
        const backendStatus = (item.order_status || "").toLowerCase()
        // pending -> Đang chờ, confirmed -> Đang giao, shipped -> Đã giao
        let displayStatus = "Đang chờ"
        if (backendStatus === "confirmed") displayStatus = "Đang giao"
        else if (backendStatus === "shipped") displayStatus = "Đã giao"

        const quantityNumber = item.quantity ?? 0
        const priceNumber = Number.parseFloat(item.price) || 0
        const subtotalFromBackend = item.subtotal !== undefined && item.subtotal !== null
          ? Number.parseFloat(item.subtotal)
          : null
        
        // Ưu tiên dùng price từ backend (đã là tổng tiền dòng)
        // Chỉ dùng subtotal nếu nó hợp lý (không quá lớn so với price)
        // Tránh trường hợp subtotal bị nhân 2 lần từ đơn hàng cũ
        let subtotalNumber = priceNumber // Mặc định dùng price
        if (subtotalFromBackend !== null) {
          // Nếu subtotal gần bằng price (sai số < 10%), thì dùng subtotal
          // Nếu subtotal lớn hơn price nhiều (có thể bị nhân 2 lần), thì dùng price
          const diff = Math.abs(subtotalFromBackend - priceNumber) / priceNumber
          if (diff < 0.1) {
            subtotalNumber = subtotalFromBackend
          } else {
            // subtotal có vẻ sai, dùng price thay thế
            console.warn('[Order Mapping] subtotal seems incorrect, using price instead', {
              price: priceNumber,
              subtotal: subtotalFromBackend,
              diff: diff
            })
            subtotalNumber = priceNumber
          }
        }

        // Tính đơn giá từ tổng tiền
        const unitPrice = quantityNumber > 0 ? subtotalNumber / quantityNumber : 0

        // Debug log - in từng giá trị riêng để dễ đọc
        console.log('[Order Mapping - reloadOrders] Item ID:', item.id)
        console.log('  Product:', item.product_name)
        console.log('  Quantity:', quantityNumber)
        console.log('  priceFromBackend:', priceNumber)
        console.log('  subtotalFromBackend:', item.subtotal)
        console.log('  calculatedSubtotal:', subtotalNumber)
        console.log('  calculatedUnitPrice:', unitPrice)
        console.log('  finalTotal (unitPrice * quantity):', unitPrice * quantityNumber)
        console.log('---')

        return {
          id: index + 1,
          detailId: item.id, // Lưu detail_id để dùng cho API reject/update
          orderCode: `DH-${item.order_id ?? item.order ?? ""}`,
          customerName: item.customer_name || item.customer_email || "Khách hàng",
          phone: "", // Chưa có field phone trong serializer
          address: "", // Chưa có field address trong serializer
          status: displayStatus,
          createdAt: item.created_at || "",
          items: [
            {
              id: item.product,
              name: item.product_name || `Sản phẩm #${item.product}`,
              quantity: quantityNumber,
              // Lưu đơn giá (tính từ tổng tiền / số lượng) để hiển thị bên cạnh x10
              price: unitPrice,
            },
          ],
          // Tổng tiền = đơn giá × số lượng (để đảm bảo tính toán đúng)
          total: unitPrice * quantityNumber,
        }
      })

      setOrders(mappedOrders)
    } catch (error) {
      console.error("Failed to reload orders:", error)
    }
  }

  const handleGoToRegistration = () => {
    setShowPermissionModal(false)
    navigate("/seller-registration")
  }

  const handleCancel = () => {
    setShowPermissionModal(false)
    navigate("/")
  }

  if (isCheckingPermission) {
    return (
      <div className="seller-dashboard">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          color: '#fff',
          fontFamily: 'Rajdhani, sans-serif'
        }}>
          <p>Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    )
  }

  if (showPermissionModal) {
    return (
      <div className="seller-dashboard">
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.95), rgba(30, 30, 45, 0.95))',
            border: '1px solid rgba(255, 94, 0, 0.25)',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            textAlign: 'center',
            color: '#fff',
            fontFamily: 'Rajdhani, sans-serif'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 700,
              marginBottom: '20px',
              background: 'linear-gradient(45deg, #ff5e00, #00b2ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: 'Orbitron, sans-serif'
            }}>
              Thông Báo
            </h2>
            <p style={{
              fontSize: '16px',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '30px',
              lineHeight: '1.6'
            }}>
              Tài khoản chưa được cấp quyền người bán, bạn có muốn đăng kí trở thành người bán không?
            </p>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={handleCancel}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#f5f5f5',
                  fontFamily: 'Rajdhani, sans-serif',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.12)'
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.08)'
                }}
              >
                Không
              </button>
              <button
                onClick={handleGoToRegistration}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: 'linear-gradient(45deg, #ff5e00, #ff8c42)',
                  border: 'none',
                  color: '#0a0a0a',
                  fontFamily: 'Rajdhani, sans-serif',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 8px 20px rgba(255, 94, 0, 0.35)'
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = 'none'
                }}
              >
                Có
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="seller-dashboard">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <MainContent
        activeMenu={activeMenu}
        orders={orders}
        setOrders={setOrders}
        products={products}
        setProducts={setProducts}
        onOrdersUpdate={reloadOrders}
      />
    </div>
  )
}

export default SellerDashboard
