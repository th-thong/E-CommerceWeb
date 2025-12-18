import { useState, useEffect } from "react"
import { fetchShopStatistics } from "@/api/orders"
import "./section.css"

const TOKEN_KEY = "auth_tokens"

const AnalyticsSection = () => {
  const [stats, setStats] = useState({
    total_orders: 0,
    total_revenue: 0,
    period: '30 ngày qua'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadStatistics = async () => {
      try {
        setLoading(true)
        const savedTokens = localStorage.getItem(TOKEN_KEY)
        const tokens = savedTokens ? JSON.parse(savedTokens) : null
        const accessToken = tokens?.access || null
        
        if (!accessToken) {
          setError("Vui lòng đăng nhập để xem thống kê")
          return
        }

        const data = await fetchShopStatistics(accessToken)
        setStats(data)
        setError(null)
      } catch (err) {
        console.error("Error loading statistics:", err)
        setError(err.message || "Không thể tải thống kê")
      } finally {
        setLoading(false)
      }
    }

    loadStatistics()
  }, [])

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
      
      {error && (
        <div style={{ padding: '20px', color: '#ff5e00', textAlign: 'center' }}>
          ⚠️ {error}
        </div>
      )}
      
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
