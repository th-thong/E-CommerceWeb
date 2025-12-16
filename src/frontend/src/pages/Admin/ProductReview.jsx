"use client"

import "../Seller/ProductManager/section.css"

const AdminProductReview = () => {
  const products = [
    {
      id: 1,
      name: "Áo thun nam casual",
      seller: "Shop A",
      category: "Thời trang",
      price: 150000,
      status: "Chờ duyệt",
    },
    {
      id: 2,
      name: "Loa Bluetooth mini",
      seller: "Shop B",
      category: "Điện tử",
      price: 350000,
      status: "Chờ duyệt",
    },
  ]

  return (
    <div className="section">
      <div className="section-header">
        <h2>Duyệt Sản Phẩm Đăng Bán</h2>
        <span className="time-info">Danh sách sản phẩm đang chờ phê duyệt</span>
      </div>

      <div className="products-table">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Tên sản phẩm</th>
              <th>Người bán</th>
              <th>Danh mục</th>
              <th>Giá đề xuất</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>{product.seller}</td>
                <td>{product.category}</td>
                <td className="price">{product.price.toLocaleString()}₫</td>
                <td>
                  <span className="status pending">{product.status}</span>
                </td>
                <td className="actions">
                  <button className="accept-btn">Phê duyệt</button>
                  <button className="reject-btn" style={{ marginLeft: 8 }}>
                    Từ chối
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminProductReview


