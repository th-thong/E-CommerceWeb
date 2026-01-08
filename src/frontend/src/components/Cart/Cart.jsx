import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import './Cart.css';

const Cart = ({ isOpen, onClose }) => {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalPrice,
    getTotalItems,
  } = useCart();
  
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const calculateItemPrice = (item) => {
    const price = item.variant?.price || item.product.base_price;
    const discount = item.product.discount || 0;
    return price * (1 - discount / 100);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="cart-modal-overlay" onClick={handleOverlayClick}>
      <div className="cart-modal">
        {/* Header */}
        <div className="cart-header">
          <h2>
            🛒 Giỏ hàng
            {getTotalItems() > 0 && (
              <span style={{ color: '#ee4d2d' }}>({getTotalItems()})</span>
            )}
          </h2>
          <button className="cart-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className="cart-body">
          {cartItems.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty-icon">🛒</div>
              <p>Giỏ hàng của bạn đang trống</p>
              <p style={{ fontSize: '14px', color: '#ccc' }}>
                Hãy thêm sản phẩm vào giỏ hàng!
              </p>
            </div>
          ) : (
            <div className="cart-items">
              {cartItems.map((item) => {
                const price = item.variant?.price || item.product.base_price;
                const discount = item.product.discount || 0;
                const finalPrice = calculateItemPrice(item);
                const image = item.product.images?.[0]?.image_url || '';

                return (
                  <div key={item.id} className="cart-item">
                    <img
                      src={image || '/placeholder-product.png'}
                      alt={item.product.product_name}
                      className="cart-item-image"
                      onError={(e) => {
                        e.target.src = '/placeholder-product.png';
                      }}
                    />

                    <div className="cart-item-details">
                      <div className="cart-item-name">
                        {item.product.product_name}
                      </div>

                      {/* Hiển thị thông tin variant */}
                      {item.variant && item.variant.attributes && (() => {
                        const entries = Object.entries(item.variant.attributes).filter(
                          ([, value]) =>
                            value !== null &&
                            value !== undefined &&
                            String(value).trim() !== ''
                        )

                        if (entries.length === 0) return null

                        return (
                        <div className="cart-item-variant">
                            {entries.map(([key, value]) => (
                              <span key={key}>
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                            )
                      })()}

                      {/* Giá */}
                      <div className="cart-item-price">
                        <span className="current-price">
                          {formatPrice(finalPrice)}
                        </span>
                        {discount > 0 && (
                          <>
                            <span className="original-price">
                              {formatPrice(price)}
                            </span>
                            <span className="cart-item-discount">
                              -{discount}%
                            </span>
                          </>
                        )}
                      </div>

                      {/* Số lượng và nút xóa */}
                      <div className="cart-item-actions">
                        <div className="quantity-control">
                          <button
                            className="quantity-btn"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            className="quantity-input"
                            value={item.quantity}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 1;
                              updateQuantity(item.id, value);
                            }}
                            min="1"
                          />
                          <button
                            className="quantity-btn"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                          >
                            +
                          </button>
                        </div>

                        <button
                          className="remove-btn"
                          onClick={() => removeFromCart(item.id)}
                          title="Xóa sản phẩm"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>Tổng cộng:</span>
              <span className="cart-total-price">
                {formatPrice(getTotalPrice())}
              </span>
            </div>

            <div className="cart-actions">
              <button
                className="cart-btn cart-btn-primary"
                onClick={handleCheckout}
              >
                Thanh toán ({getTotalItems()} sản phẩm)
              </button>
              <button
                className="cart-btn cart-btn-secondary"
                onClick={() => {
                  if (
                    window.confirm('Bạn có chắc muốn xóa tất cả sản phẩm?')
                  ) {
                    clearCart();
                  }
                }}
              >
                Xóa tất cả
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;

