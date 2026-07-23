import { Link } from "react-router-dom";
import "./Footer.css";
import logo from "../assets/Roomie_logo.png";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <img src={logo} alt="Roomie" className="footer-logo" />
        <nav className="footer-links">
          <Link to="/terms">이용약관</Link>
          <Link to="/privacy">개인정보처리방침</Link>
          <a href="#">고객센터</a>
          <Link to="/inquiry">문의하기</Link>
        </nav>
      </div>
      <p className="footer-copyright">&copy; 2026 Roomie. All rights reserved.</p>
    </footer>
  );
}

export default Footer;
