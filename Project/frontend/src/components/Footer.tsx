import "./Footer.css";
import logo from "../assets/Roomie_logo.png";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <img src={logo} alt="Roomie" className="footer-logo" />
        <nav className="footer-links">
          <Link to="/terms">이용약관 </Link><p>|</p>
          <Link to="/privacy">개인정보처리방침</Link><p>|</p>
          <a href="#">고객센터</a>
          <a href="#">문의하기</a>
        </nav>
      </div>
      <p className="footer-copyright">&copy; 2026 Roomie. All rights reserved.</p>
    </footer>
  );
}

export default Footer;
