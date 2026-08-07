import "./Footer.css";
import logo from "../assets/Roomie_logo.png";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <img src={logo} alt="Roomie" className="footer-logo" />
          <span className="footer-brand-name">Roomie</span>
        </div>

        <div className="footer-right">
          <nav className="footer-support-row">
            <Link to="/support" className="footer-column-title">
              고객센터
            </Link>
            <Link to="/board?type=공지사항">공지</Link>
            <Link to="/board?type=이벤트">이벤트</Link>
            <Link to="/inquiry">문의</Link>
            <Link to="/privacy">개인정보처리방침</Link>
            <Link to="/terms">이용약관</Link>
          </nav>

          {/* 실제 사업자 정보가 아니라, 다른 서비스의 표기 양식만 따온 가상의 정보입니다. */}
          <div className="footer-business-row">
            <span className="footer-business-name">(주)병아리반</span>
            <span className="footer-business-detail">
              사업자등록번호 : 214-86-12345&nbsp;|&nbsp;대표 : 최병아리&nbsp;|&nbsp;주소 : 서울특별시 강남구 테헤란로 411
            </span>
          </div>
        </div>
      </div>
      <p className="footer-copyright">&copy; 2026 Roomie. All rights reserved.</p>
    </footer>
  );
}

export default Footer;
