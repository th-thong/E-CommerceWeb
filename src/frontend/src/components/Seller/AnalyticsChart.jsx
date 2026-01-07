import { useState, useEffect } from "react"
import "./section.css"

const AnalyticsSection = ({ orders = [] }) => {
  const [stats, setStats] = useState({
    total_orders: 0,
    total_revenue: 0,
    period: '30 ngày qua'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Tính toán thống kê từ danh sách đơn hàng đã được load ở Dashboard
    try {
      setLoading(true)
      const deliveredOrders = orders.filter((order) => order.status === "Đã giao")
      // Số đơn hàng và doanh thu đều chỉ tính từ đơn đã giao
      const totalOrders = deliveredOrders.length
      const totalRevenue = deliveredOrders.reduce((sum, order) => {
        const value = Number.parseFloat(order.total) || 0
        return sum + value
      }, 0)

      setStats({
        total_orders: totalOrders,
        total_revenue: totalRevenue,
        period: "30 ngày qua",
      })
    } finally {
      setLoading(false)
    }
  }, [orders])

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value)
  }

  const displayStats = [
    { 
      label: "Số đơn hàng (30 ngày qua)", 
      value: loading ? "..." : stats.total_orders.toLocaleString('vi-VN'), 
      icon: "📦" 
    },
    { 
      label: "Doanh thu (30 ngày qua)", 
      value: loading ? "..." : formatCurrency(stats.total_revenue), 
      icon: "💰" 
    },
  ]

  return (
    <div className="section">
      <div className="section-header">
        <h2>Thống kê bán hàng</h2>
        <span className="time-info">Cập nhật: {stats.period}</span>
      </div>

      <div className="stats-grid">
        {displayStats.map((stat, idx) => (
          <div key={idx} className="stat-card">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-info">
              <p className="stat-label">{stat.label}</p>
              <p className="stat-value">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AnalyticsSection
