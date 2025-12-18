import "./Navbar.css";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import AuthModal from "@/components/Common/AuthModal/AuthModal";
import { getProfile } from "@/api/auth";
import Cart from "@/components/Cart/Cart";
import { useCart } from "@/contexts/CartContext";

const TOKEN_KEY = "auth_tokens";

const Navbar = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [cartOpen, setCartOpen] = useState(false);
  const { getTotalItems } = useCart();
  const [tokens, setTokens] = useState(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    if (tokens) {
      localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    } else {
      localStorage.removeItem(TOKEN_KEY);
      setProfile(null);
      setProfileError(null);
    }
  }, [tokens]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!tokens?.access) return;
      try {
        const data = await getProfile(tokens.access);
        setProfile(data);
        setProfileError(null);
      } catch (err) {
        setProfileError("Không lấy được thông tin user");
      }
    };
    fetchProfile();
  }, [tokens]);

  const handleAuthSuccess = (data) => {
    setTokens(data);
  };

  const handleLogout = () => {
    setTokens(null);
  };

  return (
    <>
      <header className="navbar">
        {/* Thanh trên */}
        <div className="navbar-top">
          <div className="navbar-links">
            <Link to="/admin">Kênh Admin</Link> |
            <a href="#">Trở thành Người bán ShopLiteX</a>
            <span className="social-icons">
              <i className="fab fa-facebook"></i>
              <i className="fab fa-instagram"></i>
            </span>
          </div>
        </div>

        {/* Thanh chính */}
        <div className="navbar-main">
          {/* Cụm trái: logo + tìm kiếm + giỏ hàng */}
          <div className="navbar-left">
            <Link to="/" style={{ textDecoration: "none" }}>
              <div className="logo">
                <span className="logo-text">ShopLiteX</span>
              </div>
            </Link>

            <div className="search-bar">
              <input type="text" placeholder="Tìm kiếm sản phẩm..." />
              <button className="search-btn">🔍</button>
            </div>

            <button className="btn cart-btn" onClick={() => setCartOpen(true)}>
              🛒 <span className="cart-count">{getTotalItems()}</span>
            </button>
          </div>

          {/* Cụm phải: đăng ký / đăng nhập */}
          <div className="navbar-right">
            {tokens ? (
              <>
                <div className="navbar-user">
                  <div className="navbar-avatar">
                    {/* chữ cái đầu làm avatar tạm */}
                    {(profile?.user_name?.[0] || profile?.email?.[0] || "U").toUpperCase()}
                  </div>
                  <div className="navbar-username">
                    {profile?.user_name || profile?.email || "Đã đăng nhập"}
                  </div>
                </div>
                <button className="btn" onClick={handleLogout}>
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn"
                  onClick={() => {
                    setAuthMode("signup");
                    setAuthOpen(true);
                  }}
                >
                  Đăng Ký
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    setAuthMode("login");
                    setAuthOpen(true);
                  }}
                >
                  Đăng Nhập
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={authOpen}
        initialMode={authMode}
        onClose={() => setAuthOpen(false)}
        onModeChange={setAuthMode}
        onAuthSuccess={handleAuthSuccess}
      />

      <Cart isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
};

export default Navbar;