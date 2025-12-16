import React from "react"
import "./product-catalog.css"

/**
 * Skeleton UI cho Product Card khi đang loading
 */
export default function ProductCardSkeleton() {
  return (
    <div className="catalog-card catalog-card--skeleton">
      <div className="catalog-card__media">
        <div className="skeleton-image" style={{ width: "100%", height: "100%" }} />
        <div className="skeleton-text" style={{ 
          position: "absolute", 
          top: "20px", 
          left: "20px", 
          width: "100px", 
          height: "24px", 
          borderRadius: "999px" 
        }} />
        <div className="skeleton-text" style={{ 
          position: "absolute", 
          bottom: "18px", 
          left: "20px", 
          width: "80px", 
          height: "28px", 
          borderRadius: "999px" 
        }} />
      </div>
      <div className="catalog-card__body">
        <div className="skeleton-text" style={{ width: "70%", height: "24px", marginBottom: "10px" }} />
        <div className="skeleton-text" style={{ width: "90%", height: "16px", marginBottom: "8px" }} />
        <div className="skeleton-text" style={{ width: "80%", height: "16px", marginBottom: "18px" }} />
        <div className="catalog-card__meta">
          <div className="skeleton-text" style={{ width: "60px", height: "16px" }} />
          <div className="skeleton-text" style={{ width: "100px", height: "16px" }} />
        </div>
      </div>
      <div className="catalog-card__footer">
        <div className="skeleton-text" style={{ width: "120px", height: "20px" }} />
        <div className="skeleton-text" style={{ width: "100px", height: "16px" }} />
      </div>
    </div>
  )
}

