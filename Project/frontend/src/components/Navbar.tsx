import { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";
import LoginModal from "./LoginModal";

function Navbar() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <header className="navbar">
      <nav className="navbar-menu">
        <Link to="/">홈</Link>
        <a href="#">매칭</a>
        <a href="#">모집글</a>
        <a href="#">문의</a>
      </nav>
      <div className="navbar-auth">
        <Link to="/signup" className="navbar-auth-link">
          회원가입
        </Link>
        <button className="navbar-auth-link" onClick={() => setIsLoginOpen(true)}>
          로그인
        </button>
      </div>
      {isLoginOpen && (
        <LoginModal
          onClose={() => setIsLoginOpen(false)}
          onLoginSuccess={(token) => {
            localStorage.setItem("token", token);
            setIsLoginOpen(false);
          }}
        />
      )}
    </header>
  );
}

export default Navbar;
