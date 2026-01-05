import "./Navbar.css";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import AuthModal from "@/components/Common/AuthModal/AuthModal";
import { getProfile } from "@/api/auth";
import Cart from "@/components/Cart/Cart";
import { useCart } from "@/contexts/CartContext";

const TOKEN_KEY = "auth_tokens";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [cartOpen, setCartOpen] = useState(false);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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

  // Đồng bộ searchQuery với URL params
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    } else {
      // Nếu không có search param trong URL, xóa searchQuery
      setSearchQuery("");
    }
  }, [location.search]);

  const handleAuthSuccess = (data) => {
    setTokens(data);
  };

  const handleLogout = () => {
    setTokens(null);
  };

  const handleSellerLinkClick = async (e) => {
    e.preventDefault();
    
    // Nếu chưa đăng nhập, chuyển đến trang đăng nhập
    if (!tokens?.access) {
      setAuthMode("login");
      setAuthOpen(true);
      return;
    }

    // Kiểm tra quyền seller
    try {
      const userProfile = profile || await getProfile(tokens.access);
      if (userProfile.role === "Seller" || userProfile.role === "Admin") {
        // Nếu là seller, navigate đến trang seller
        navigate("/seller");
      } else {
        // Nếu không phải seller, hiển thị popup
        setShowSellerModal(true);
      }
    } catch (err) {
      console.error("Error checking seller permission:", err);
      // Nếu có lỗi, vẫn hiển thị popup
      setShowSellerModal(true);
    }
  };

  const handleSellerModalYes = () => {
    setShowSellerModal(false);
    navigate("/seller-registration");
  };

  const handleSellerModalNo = () => {
    setShowSellerModal(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to home với search query
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      // Scroll to top để xem kết quả
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  return (
    <>
      <header className="navbar">
        {/* Thanh trên */}
        <div className="navbar-top">
          <div className="navbar-links">
            <Link to="/admin">Kênh Admin</Link> |
            <a href="#" onClick={handleSellerLinkClick} style={{ cursor: 'pointer' }}>Kênh người bán</a> |
            <Link to="/seller-registration">Trở thành người bán ShopLiteX</Link>
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

            <form className="search-bar" onSubmit={handleSearch}>
              <input 
                type="text" 
                placeholder="Tìm kiếm sản phẩm..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
              />
              <button type="submit" className="search-btn">🔍</button>
            </form>

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

      {showSellerModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.95), rgba(30, 30, 45, 0.95))',
            border: '1px solid rgba(255, 94, 0, 0.25)',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            textAlign: 'center',
            color: '#fff',
            fontFamily: 'Rajdhani, sans-serif'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 700,
              marginBottom: '20px',
              background: 'linear-gradient(45deg, #ff5e00, #00b2ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: 'Orbitron, sans-serif'
            }}>
              Thông Báo
            </h2>
            <p style={{
              fontSize: '16px',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '30px',
              lineHeight: '1.6'
            }}>
              Tài khoản chưa được cấp quyền người bán, bạn có muốn đăng kí trở thành người bán không?
            </p>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={handleSellerModalNo}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#f5f5f5',
                  fontFamily: 'Rajdhani, sans-serif',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.12)'
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.08)'
                }}
              >
                Không
              </button>
              <button
                onClick={handleSellerModalYes}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: 'linear-gradient(45deg, #ff5e00, #ff8c42)',
                  border: 'none',
                  color: '#0a0a0a',
                  fontFamily: 'Rajdhani, sans-serif',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 8px 20px rgba(255, 94, 0, 0.35)'
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = 'none'
                }}
              >
                Có
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;