import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_ORIGIN } from "../api";
import "./Navbar.css";
import LoginModal from "./LoginModal";
import logo from "../assets/Roomie_logo.png";

function Navbar() {
  const navigate = useNavigate();
  const { token, user, login } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [redirectAfterLogin, setRedirectAfterLogin] = useState(false);

  const handleMatchClick = () => {
    if (token) {
      navigate("/survey");
      return;
    }
    setRedirectAfterLogin(true);
    setIsLoginOpen(true);
  };

  return (
    <header className="navbar">
      <nav className="navbar-menu">
        <Link to="/" className="navbar-logo">
          <img src={logo} alt="Roomie" />
        </Link>
        <button type="button" className="navbar-menu-link" onClick={handleMatchClick}>
          매칭
        </button>
        <a href="#">모집</a>
        <a href="#">고객센터</a>
      </nav>
      <div className="navbar-auth">
        {token ? (
          <Link to="/mypage" className="navbar-profile-btn" aria-label="마이페이지">
            <img
              src={user?.profileImageUrl ? `${API_ORIGIN}${user.profileImageUrl}` : logo}
              alt=""
            />
          </Link>
        ) : (
          <button className="navbar-auth-link" onClick={() => setIsLoginOpen(true)}>
            로그인
          </button>
        )}
      </div>
      {isLoginOpen && (
        <LoginModal
          onClose={() => {
            setIsLoginOpen(false);
            setRedirectAfterLogin(false);
          }}
          onLoginSuccess={(token) => {
            login(token);
            setIsLoginOpen(false);
            if (redirectAfterLogin) {
              navigate("/survey");
              setRedirectAfterLogin(false);
            }
          }}
        />
      )}
    </header>
  );
}

export default Navbar;
