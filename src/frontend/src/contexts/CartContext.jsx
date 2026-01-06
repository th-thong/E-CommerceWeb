import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

const CART_KEY_PREFIX = 'cart_';

const getCurrentUserId = () => {
  try {
    const tokensRaw = localStorage.getItem('auth_tokens');
    if (!tokensRaw) return null;
    const tokens = JSON.parse(tokensRaw);
    // Có thể mở rộng: decode JWT để lấy user_id, hiện tạm dùng access token làm key
    return tokens?.access || null;
  } catch (error) {
    console.error('Error reading auth tokens for cart:', error);
    return null;
  }
};

const getStorageKey = () => {
  const userId = getCurrentUserId();
  return userId ? `${CART_KEY_PREFIX}${userId}` : 'cart_guest';
};

export const CartProvider = ({ children }) => {
  // Lấy giỏ hàng từ localStorage khi khởi tạo
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(getStorageKey());
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading cart:', error);
      return [];
    }
  });

  // Lưu giỏ hàng vào localStorage mỗi khi thay đổi
  useEffect(() => {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  }, [cartItems]);

  // Theo dõi thay đổi đăng nhập/đăng xuất để reset hoặc nạp lại giỏ hàng
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'auth_tokens') {
        // Khi login/logout ở tab khác, đồng bộ lại giỏ hàng hiện tại
        try {
          const saved = localStorage.getItem(getStorageKey());
          setCartItems(saved ? JSON.parse(saved) : []);
        } catch (error) {
          console.error('Error syncing cart after auth change:', error);
          setCartItems([]);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Hàm explicit để Navbar gọi sau khi login/logout
  const reloadCartFromStorage = () => {
    try {
      const saved = localStorage.getItem(getStorageKey());
      setCartItems(saved ? JSON.parse(saved) : []);
    } catch (error) {
      console.error('Error reloading cart explicitly:', error);
      setCartItems([]);
    }
  };

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
    reloadCartFromStorage,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

