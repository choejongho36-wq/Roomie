import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";
import LoginModal from "./LoginModal";
import logo from "../assets/Roomie_logo.png";

function Navbar() {
  const { token, login } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <header className="navbar">
      <nav className="navbar-menu">
        <Link to="/" className="navbar-logo">
          <img src={logo} alt="Roomie" />
        </Link>
        <a href="#">매칭</a>
        <a href="#">모집글</a>
        <a href="#">문의</a>
      </nav>
      <div className="navbar-auth">
        {token ? (
          <Link to="/mypage" className="navbar-profile-btn" aria-label="마이페이지">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
            </svg>
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
