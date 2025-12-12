import TodoSection from "./todo"
import AnalyticsSection from "./analytics"
import ProductManagement from "./productmanagement"
import OrderManagement from "./ordermanagement"
import "./main-content.css"

const MainContent = ({ activeMenu, orders, setOrders, products, setProducts }) => {
  return (
    <main className="main-content">
      {activeMenu === "todo" && <TodoSection orders={orders} products={products} />}
      {activeMenu === "analytics" && <AnalyticsSection />}
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
        <OrderManagement filterStatus={activeMenu} orders={orders} setOrders={setOrders} />
      )}
    </main>
  )
}
export default MainContent
