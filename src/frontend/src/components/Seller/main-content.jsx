import TodoSection from "./TodoList"
import AnalyticsSection from "./AnalyticsChart"
import ProductManagement from "@/pages/Seller/ProductManager/ProductManagement"
import OrderManagement from "@/pages/Seller/OrderManager/OrderManagement"
import FeedbackManagement from "@/pages/Seller/FeedbackManager/FeedbackManagement"
import "./main-content.css"

const MainContent = ({ activeMenu, orders, setOrders, products, setProducts, onOrdersUpdate }) => {
  return (
    <main className="main-content">
      {activeMenu === "todo" && <TodoSection orders={orders} products={products} />}
      {activeMenu === "analytics" && <AnalyticsSection orders={orders} />}
      {activeMenu === "services" && <ServicesSection />}
      {activeMenu === "kol" && <KOLSection />}
      {activeMenu === "livestream" && <LivestreamSection />}
      {activeMenu === "products" && (
        <ProductManagement products={products} setProducts={setProducts} />
      )}
      {(activeMenu === "orders" ||
        activeMenu === "orders-pending" ||
        activeMenu === "orders-preparing" ||
        activeMenu === "orders-shipping") && (
        <OrderManagement 
          filterStatus={activeMenu} 
          orders={orders} 
          setOrders={setOrders}
          onOrdersUpdate={onOrdersUpdate}
        />
      )}
      {activeMenu === "feedback-management" && <FeedbackManagement />}
    </main>
  )
}
export default MainContent
