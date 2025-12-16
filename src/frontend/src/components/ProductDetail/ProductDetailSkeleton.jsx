import React from "react"
import "./product-detail.css"

/**
 * Skeleton UI cho ProductDetail khi đang loading
 * Giữ nguyên layout như ProductDetail nhưng hiển thị placeholder
 */
export default function ProductDetailSkeleton() {
  return (
    <section id="product-detail" className="product-detail">
      <div className="product-detail__breadcrumbs skeleton-text" style={{ width: "300px", height: "16px" }} />

      <div className="product-detail__grid">
        <div className="product-detail__media">
          <div className="product-detail__hero">
            <div className="skeleton-image" style={{ width: "100%", aspectRatio: "1", borderRadius: "20px" }} />
          </div>

          <div className="product-detail__thumbnails">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="product-detail__thumbnail"
                style={{ pointerEvents: "none" }}
              >
                <div className="skeleton-image" style={{ width: "100%", aspectRatio: "1", borderRadius: "12px" }} />
              </div>
            ))}
          </div>
        </div>

        <div className="product-detail__info">
          <div className="skeleton-text" style={{ width: "150px", height: "14px", marginBottom: "8px" }} />
          <div className="skeleton-text" style={{ width: "80%", height: "36px", marginBottom: "12px" }} />
          <div className="skeleton-text" style={{ width: "90%", height: "20px", marginBottom: "18px" }} />
          <div className="skeleton-text" style={{ width: "70%", height: "18px", marginBottom: "20px" }} />

          <div className="product-detail__meta">
            <div className="skeleton-text" style={{ width: "120px", height: "18px", marginBottom: "8px" }} />
            <div className="skeleton-text" style={{ width: "200px", height: "16px" }} />
          </div>

          <div className="product-detail__pricing">
            <div className="skeleton-text" style={{ width: "180px", height: "40px" }} />
            <div className="skeleton-text" style={{ width: "100px", height: "20px" }} />
            <div className="skeleton-text" style={{ width: "60px", height: "24px" }} />
          </div>

          <div className="skeleton-text" style={{ width: "100px", height: "20px", marginBottom: "22px" }} />

          <div className="product-detail__variants">
            {[1, 2].map((i) => (
              <div key={i} className="product-detail__variant">
                <div className="skeleton-text" style={{ width: "80px", height: "16px", marginBottom: "10px" }} />
                <div className="product-detail__variant-options">
                  {[1, 2, 3].map((j) => (
                    <div
                      key={j}
                      className="skeleton-button"
                      style={{ width: "80px", height: "36px", borderRadius: "999px" }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <ul className="product-detail__highlights">
            {[1, 2, 3, 4].map((i) => (
              <li key={i}>
                <div className="skeleton-text" style={{ width: `${80 + i * 10}%`, height: "16px" }} />
              </li>
            ))}
          </ul>

          <div className="product-detail__actions">
            <div className="skeleton-button" style={{ flex: 1, minWidth: "160px", height: "48px", borderRadius: "16px" }} />
            <div className="skeleton-button" style={{ flex: 1, minWidth: "160px", height: "48px", borderRadius: "16px" }} />
          </div>
        </div>
      </div>

      <div className="product-detail__panels">
        <article className="panel">
          <h2>Thông tin chi tiết</h2>
          <dl>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="panel__spec">
                <div className="skeleton-text" style={{ width: "120px", height: "16px" }} />
                <div className="skeleton-text" style={{ width: "150px", height: "16px" }} />
              </div>
            ))}
          </dl>
        </article>

        <article className="panel">
          <h2>Đánh giá nổi bật</h2>
          <div className="panel__reviews">
            {[1, 2].map((i) => (
              <div key={i} className="review-card">
                <div className="review-card__header">
                  <div className="skeleton-text" style={{ width: "100px", height: "18px" }} />
                  <div className="skeleton-text" style={{ width: "120px", height: "14px" }} />
                </div>
                <div className="skeleton-text" style={{ width: "90%", height: "16px", marginTop: "8px" }} />
                <div className="skeleton-text" style={{ width: "70%", height: "16px", marginTop: "4px" }} />
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}

