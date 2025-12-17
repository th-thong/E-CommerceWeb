import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import SellerDashboard from "./pages/Seller/Dashboard/Dashboard"
import Payment from "./pages/Public/Payment/Payment"
import Admin from "./pages/Admin/Admin"

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/seller" element={<SellerDashboard />} />
        <Route path="/checkout" element={<Payment />} />
      </Routes>
    </BrowserRouter>
  )
}
export default App