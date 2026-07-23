import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_ORIGIN } from "../api";
import "./Navbar.css";
import LoginModal from "./LoginModal";
import logo from "../assets/Roomie_logo.png";

function Navbar() {
  const { token, user, login } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <header className="navbar">
      <nav className="navbar-menu">
        <Link to="/" className="navbar-logo">
          <img src={logo} alt="Roomie" />
        </Link>
        <Link to="/survey">매칭</Link>
        <a href="#">모집글</a>
        <a href="#">문의</a>
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
          onClose={() => setIsLoginOpen(false)}
          onLoginSuccess={(token) => {
            login(token);
            setIsLoginOpen(false);
          }}
        />
      )}
    </header>
  );
}

export default Navbar;
