import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import SellerDashboard from "./pages/Seller/Dashboard/Dashboard"
import Payment from "./pages/Public/Payment/Payment"
import Admin from "./pages/Admin/Admin"
import ProductPage from "./components/ProductDetail/ProductPage"
import Account from "./pages/User/Account"
import Orders from "./pages/User/Orders"
import SellerRegistrationPage from "./pages/SellerRegistrationPage"
import { CartProvider } from "./contexts/CartContext"
import { NotificationProvider } from "./contexts/NotificationContext"

const App = () => {
  return (
    <BrowserRouter>
      <CartProvider>
        <NotificationProvider>
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:productId" element={<ProductPage />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/seller" element={<SellerDashboard />} />
          <Route path="/seller-registration" element={<SellerRegistrationPage />} />
          <Route path="/checkout" element={<Payment />} />
          <Route path="/account" element={<Account />} />
          <Route path="/orders" element={<Orders />} />
          </Routes>
        </NotificationProvider>
      </CartProvider>
    </BrowserRouter>
  )
}
export default App