import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import SellerDashboard from "./pages/Seller/Dashboard/Dashboard"
import Payment from "./pages/Public/Payment/Payment"
import Admin from "./pages/Admin/Admin"
import ProductPage from "./components/ProductDetail/ProductPage"
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
          <Route path="/checkout" element={<Payment />} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  )
}
export default App