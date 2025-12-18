import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  // Lấy giỏ hàng từ localStorage khi khởi tạo
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading cart:', error);
      return [];
    }
  });

  // Lưu giỏ hàng vào localStorage mỗi khi thay đổi
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  }, [cartItems]);

  // Thêm sản phẩm vào giỏ hàng
  const addToCart = (product, variant = null, quantity = 1) => {
    setCartItems((prevItems) => {
      // Tìm xem sản phẩm đã có trong giỏ hàng chưa
      const existingIndex = prevItems.findIndex(
        (item) =>
          item.product.product_id === product.product_id &&
          item.variant?.id === variant?.id
      );

      if (existingIndex > -1) {
        // Nếu đã có, tăng số lượng
        const newItems = [...prevItems];
        newItems[existingIndex].quantity += quantity;
        return newItems;
      } else {
        // Nếu chưa có, thêm mới
        return [
          ...prevItems,
          {
            id: Date.now(), // ID tạm thời cho item trong giỏ hàng
            product,
            variant,
            quantity,
          },
        ];
      }
    });
  };

  // Cập nhật số lượng sản phẩm
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Xóa sản phẩm khỏi giỏ hàng
  const removeFromCart = (itemId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  };

  // Xóa toàn bộ giỏ hàng
  const clearCart = () => {
    setCartItems([]);
  };

  // Tính tổng tiền
  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const price = item.variant?.price || item.product.base_price;
      const discount = item.product.discount || 0;
      const finalPrice = price * (1 - discount / 100);
      return total + finalPrice * item.quantity;
    }, 0);
  };

  // Đếm tổng số sản phẩm trong giỏ hàng
  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalPrice,
    getTotalItems,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

