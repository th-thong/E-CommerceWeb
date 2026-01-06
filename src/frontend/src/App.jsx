import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import SellerDashboard from "./pages/Seller/Dashboard/Dashboard"
import Payment from "./pages/Public/Payment/Payment"
import Admin from "./pages/Admin/Admin"
import ProductPage from "./components/ProductDetail/ProductPage"
<<<<<<< HEAD
import Account from "./pages/User/Account"
import Orders from "./pages/User/Orders"
=======
import SellerRegistrationPage from "./pages/SellerRegistrationPage"
>>>>>>> c6c20fd1348c222349e24d1a49baedfa050e2421
import { CartProvider } from "./contexts/CartContext"

const App = () => {
  return (
    <BrowserRouter>
      <CartProvider>
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
      </CartProvider>
    </BrowserRouter>
  )
}
export default App