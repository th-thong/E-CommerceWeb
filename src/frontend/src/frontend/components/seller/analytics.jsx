import "./section.css"

const AnalyticsSection = () => {
  const stats = [
    { label: "Chỉ tiêu cần làm", value: "1.235", icon: "📦" },
    { label: "Doanh thu tháng này", value: "45.320.000₫", icon: "💰" },
  ]

  return (
    <div className="section">
      <div className="section-header">
        <h2>Thống kê bán hàng</h2>
        <span className="time-info">Cập nhật hàng ngày</span>
      </div>
      <div className="stats-grid">
        {stats.map((stat, idx) => (
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
