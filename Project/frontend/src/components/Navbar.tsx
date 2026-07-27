import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_ORIGIN, getMySurveys } from "../api";
import "./Navbar.css";
import LoginModal from "./LoginModal";
import logo from "../assets/Roomie_logo.png";
import { Icon, NAV_ITEMS } from "./mypage/MyPageSidebar";

const PROFILE_MENU_ITEMS = NAV_ITEMS.filter((item) => item.icon !== "bell");

function Navbar() {
  const navigate = useNavigate();
  const { token, user, login, logout } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [redirectAfterLogin, setRedirectAfterLogin] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleMatchClick = async () => {
    if (!token) {
      setRedirectAfterLogin(true);
      setIsLoginOpen(true);
      return;
    }

    try {
      const surveys = await getMySurveys(token);
      if (surveys.length > 0) {
        navigate("/recommend");
      } else {
        navigate("/survey");
      }
    } catch {
      navigate("/survey");
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-shell">
        <Link to="/" className="navbar-logo">
          <img src={logo} alt="Roomie" />
        </Link>
        <nav className="navbar-menu">
          <button type="button" className="navbar-menu-link" onClick={handleMatchClick}>
            매칭
          </button>
          <Link to="/board" className="navbar-menu-link">
            모집
          </Link>
          <div className="navbar-dropdown">
            <span className="navbar-menu-link navbar-dropdown-trigger">고객센터</span>
            <div className="navbar-dropdown-menu">
              <Link to="/inquiry" className="navbar-dropdown-item">
                문의 게시판
              </Link>
            </div>
          </div>
        </nav>
        <div className="navbar-auth">
          {token ? (
            <div className="navbar-dropdown navbar-profile-dropdown">
              <span className="navbar-profile-trigger">
                <img
                  className="navbar-profile-btn"
                  src={user?.profileImageUrl ? `${API_ORIGIN}${user.profileImageUrl}` : logo}
                  alt=""
                />
                <span className="navbar-profile-nickname">{user?.nickname}</span>
              </span>
              <div className="navbar-dropdown-menu navbar-profile-dropdown-menu">
                {PROFILE_MENU_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `navbar-profile-dropdown-item${isActive ? " navbar-profile-dropdown-item-active" : ""}`
                    }
                  >
                    <Icon name={item.icon} />
                    {item.label}
                  </NavLink>
                ))}
                <button
                  type="button"
                  className="navbar-profile-dropdown-item navbar-profile-dropdown-item-logout"
                  onClick={handleLogout}
                >
                  <Icon name="logout" />
                  로그아웃
                </button>
              </div>
            </div>
          ) : (
            <button className="navbar-auth-link" onClick={() => setIsLoginOpen(true)}>
              로그인
            </button>
          )}
        </div>
      </div>
      {isLoginOpen && (
        <LoginModal
          onClose={() => {
            setIsLoginOpen(false);
            setRedirectAfterLogin(false);
          }}
          onLoginSuccess={async (token) => {
            login(token);
            setIsLoginOpen(false);
            if (redirectAfterLogin) {
              setRedirectAfterLogin(false);
              try {
                const surveys = await getMySurveys(token);
                if (surveys.length > 0) {
                  navigate("/recommend");
                } else {
                  navigate("/survey");
                }
              } catch {
                navigate("/survey");
              }
            }
          }}
        />
      )}
    </header>
  );
}

export default Navbar;
