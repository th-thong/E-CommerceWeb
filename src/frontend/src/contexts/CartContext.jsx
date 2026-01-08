import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

const CART_KEY_PREFIX = 'cart_';

// Decode JWT để lấy user_id từ payload (không verify, chỉ để lấy user_id)
const decodeJWT = (token) => {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload.user_id || payload.userId || null;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

const getCurrentUserId = () => {
  try {
    const tokensRaw = localStorage.getItem('auth_tokens');
    if (!tokensRaw) return null;
    const tokens = JSON.parse(tokensRaw);
    if (!tokens?.access) return null;
    
    // Ưu tiên: dùng user_id đã lưu trong tokens (từ profile API)
    if (tokens.user_id) {
      return String(tokens.user_id);
    }
    
    // Fallback: Decode JWT để lấy user_id từ payload
    const userId = decodeJWT(tokens.access);
    if (userId) return String(userId);
    
    // Fallback cuối: dùng access token (cho tương thích ngược)
    return tokens.access;
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
  // Flag để tránh auto-save khi đang reload từ storage
  const [isReloading, setIsReloading] = useState(false);
  // Flag để đánh dấu đã load cart lần đầu (tránh ghi đè khi đăng nhập)
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Lấy giỏ hàng từ localStorage khi khởi tạo
  const [cartItems, setCartItems] = useState(() => {
    try {
      const storageKey = getStorageKey();
      const saved = localStorage.getItem(storageKey);
      const parsed = saved ? JSON.parse(saved) : [];
      console.log('[Cart] Initial load from:', storageKey, 'items:', parsed.length);
      // Không set hasInitialized ở đây - sẽ được set sau khi reloadCartFromStorage chạy
      return parsed;
    } catch (error) {
      console.error('[Cart] Error loading cart:', error);
      return [];
    }
  });

  // Lưu giỏ hàng vào localStorage mỗi khi thay đổi (trừ khi đang reload hoặc chưa khởi tạo)
  useEffect(() => {
    if (isReloading) {
      console.log('[Cart] Skipping auto-save during reload');
      return;
    }
    
    // Không auto-save ngay sau khi mount (để tránh ghi đè khi đăng nhập)
    if (!hasInitialized) {
      console.log('[Cart] Skipping auto-save - not initialized yet');
      return;
    }
    
    try {
      const storageKey = getStorageKey();
      const userId = getCurrentUserId();
      
      // Chỉ lưu nếu có key hợp lệ (không phải cart_guest khi đã đăng nhập)
      if (userId && storageKey !== 'cart_guest') {
        // Kiểm tra xem giỏ hàng trong localStorage có khác không
        const existingRaw = localStorage.getItem(storageKey);
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        
        // Chỉ lưu nếu giỏ hàng hiện tại không rỗng HOẶC giỏ hàng trong storage cũng rỗng
        // (tránh ghi đè giỏ hàng đã lưu bằng mảng rỗng)
        if (cartItems.length > 0 || existing.length === 0) {
          localStorage.setItem(storageKey, JSON.stringify(cartItems));
          console.log('[Cart] Auto-saved cart to:', storageKey, 'items:', cartItems.length);
        } else {
          console.log('[Cart] Skipping auto-save - existing cart has items, current is empty');
        }
      } else if (!userId) {
        // Chỉ lưu vào guest cart khi chưa đăng nhập
        localStorage.setItem('cart_guest', JSON.stringify(cartItems));
        console.log('[Cart] Auto-saved guest cart, items:', cartItems.length);
      }
    } catch (error) {
      console.error('[Cart] Error saving cart:', error);
    }
  }, [cartItems, isReloading, hasInitialized]);

  // Hợp nhất giỏ hàng guest vào giỏ hàng user sau khi đăng nhập
  const reloadCartFromStorage = useCallback(() => {
    try {
      setIsReloading(true); // Bật flag để tránh auto-save
      
      const userId = getCurrentUserId();
      console.log('[Cart] Reloading cart, userId:', userId);

      // Nếu chưa đăng nhập: chỉ đọc giỏ guest
      if (!userId) {
        const guestSaved = localStorage.getItem('cart_guest');
        const guestCart = guestSaved ? JSON.parse(guestSaved) : [];
        console.log('[Cart] Guest cart loaded:', guestCart.length, 'items');
        setCartItems(guestCart);
        setHasInitialized(true); // Đánh dấu đã khởi tạo
        setIsReloading(false);
        return;
      }

      const userKey = `${CART_KEY_PREFIX}${userId}`;
      const guestRaw = localStorage.getItem('cart_guest');
      const userRaw = localStorage.getItem(userKey);

      console.log('[Cart] User key:', userKey);
      console.log('[Cart] Guest cart exists:', !!guestRaw);
      console.log('[Cart] User cart exists:', !!userRaw);

      const guestCart = guestRaw ? JSON.parse(guestRaw) : [];
      const userCart = userRaw ? JSON.parse(userRaw) : [];

      console.log('[Cart] Guest cart items:', guestCart.length, guestCart);
      console.log('[Cart] User cart items:', userCart.length, userCart);
      
      // Debug: Kiểm tra raw data
      if (userRaw) {
        console.log('[Cart] User cart raw data:', userRaw.substring(0, 200));
      }

      // Hàm merge: cộng dồn quantity nếu trùng product + variant
      const mergedCart = [...userCart];

      guestCart.forEach((guestItem) => {
        const index = mergedCart.findIndex(
          (item) =>
            item.product?.product_id === guestItem.product?.product_id &&
            (item.variant?.id || null) === (guestItem.variant?.id || null)
        );

        if (index > -1) {
          mergedCart[index] = {
            ...mergedCart[index],
            quantity: (mergedCart[index].quantity || 0) + (guestItem.quantity || 0),
          };
        } else {
          mergedCart.push(guestItem);
        }
      });

      console.log('[Cart] Merged cart items:', mergedCart.length);

      // Lưu merged cart cho user và xóa giỏ guest
      // Lưu trước khi setState để đảm bảo localStorage được cập nhật
      localStorage.setItem(userKey, JSON.stringify(mergedCart));
      console.log('[Cart] Saved merged cart to:', userKey);
      
      if (guestRaw) {
        localStorage.removeItem('cart_guest');
        console.log('[Cart] Removed guest cart');
      }

      // Set state sau khi đã lưu vào localStorage
      setCartItems(mergedCart);
      
      // Đánh dấu đã khởi tạo để cho phép auto-save
      setHasInitialized(true);
      
      // Tắt flag sau một chút để cho phép auto-save lại
      setTimeout(() => {
        setIsReloading(false);
      }, 500);
    } catch (error) {
      console.error('[Cart] Error reloading/merging cart from storage:', error);
      setCartItems([]);
      setHasInitialized(true); // Đánh dấu đã khởi tạo ngay cả khi có lỗi
      setIsReloading(false);
    }
  }, []); // Empty deps vì chỉ sử dụng setters và localStorage

  // Theo dõi thay đổi đăng nhập/đăng xuất để reset hoặc nạp lại giỏ hàng
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'auth_tokens') {
        // Khi login/logout ở tab khác, đồng bộ lại giỏ hàng hiện tại
        reloadCartFromStorage();
      }
    };

    // Lắng nghe custom event khi auth thay đổi trong cùng tab
    const handleAuthChange = () => {
      reloadCartFromStorage();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authTokensChanged', handleAuthChange);

    // Gọi reloadCartFromStorage khi component mount để đảm bảo cart được load đúng
    // (đặc biệt quan trọng khi đăng nhập lại)
    reloadCartFromStorage();
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authTokensChanged', handleAuthChange);
    };
  }, [reloadCartFromStorage]);

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

