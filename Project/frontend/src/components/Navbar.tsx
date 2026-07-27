import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_ORIGIN, getMySurveys } from "../api";
import "./Navbar.css";
import LoginModal from "./LoginModal";
import logo from "../assets/Roomie_logo.png";
import logoWhite from "../assets/Roomie_logo2.png";
import { Icon, NAV_ITEMS } from "./mypage/MyPageSidebar";

const PROFILE_MENU_ITEMS = NAV_ITEMS.filter((item) => item.icon !== "bell");

// 배경 자체가 진한 오렌지 그라데이션인 페이지 — 네비바는 연한 필로 반전해서 대비를 준다.
const VIVID_BACKGROUND_PATHS = new Set(["/", "/signup"]);

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user, login, logout } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [redirectAfterLogin, setRedirectAfterLogin] = useState(false);

  const isOnVividBackground = VIVID_BACKGROUND_PATHS.has(location.pathname);

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
    <header className={`navbar${isOnVividBackground ? " navbar-light" : ""}`}>
      <div className="navbar-shell">
        <Link to="/" className="navbar-logo">
          <img src={isOnVividBackground ? logo : logoWhite} alt="Roomie" />
        </Link>
        <nav className="navbar-menu">
          <button type="button" className="navbar-menu-link" onClick={handleMatchClick}>
            매칭
          </button>
          <div className="navbar-dropdown">
            <span className="navbar-menu-link navbar-dropdown-trigger">커뮤니티</span>
            <div className="navbar-dropdown-menu">
              <Link to="/board?type=모집게시판" className="navbar-dropdown-item">
                모집게시판
              </Link>
              <Link to="/board?type=고민게시판" className="navbar-dropdown-item">
                고민게시판
              </Link>
            </div>
          </div>
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
