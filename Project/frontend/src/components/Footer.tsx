import { useState } from "react";
import "./Footer.css";
import logo from "../assets/Roomie_logo.png";
import { Link } from "react-router-dom";

function Footer() {
  // 카카오톡/인스타그램/네이버 아이콘은 실제 채널 연결 전이라, 눌러도 이동시키지 않고
  // 아직 연결되지 않았다는 안내만 모달로 보여준다.
  const [showSocialModal, setShowSocialModal] = useState(false);

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
            <div className="footer-business-name-row">
              <div className="footer-social-icons">
                <button type="button" className="footer-social-icon" aria-label="카카오톡" onClick={() => setShowSocialModal(true)}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4C6.48 4 2 7.35 2 11.5c0 2.65 1.83 4.97 4.58 6.31-.2.73-.73 2.66-.84 3.07-.13.5.18.5.39.36.16-.11 2.6-1.76 3.66-2.48.71.11 1.45.17 2.21.17 5.52 0 10-3.35 10-7.43S17.52 4 12 4z" />
                  </svg>
                </button>
                <button type="button" className="footer-social-icon" aria-label="인스타그램" onClick={() => setShowSocialModal(true)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="3" width="18" height="18" rx="6" />
                    <circle cx="12" cy="12" r="4.2" />
                    <circle cx="17.3" cy="6.7" r="0.6" fill="currentColor" stroke="none" />
                  </svg>
                </button>
                <button type="button" className="footer-social-icon" aria-label="네이버" onClick={() => setShowSocialModal(true)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 5v14M6 5l12 14M18 5v14" />
                  </svg>
                </button>
              </div>
              <span className="footer-business-name">(주)병아리반</span>
            </div>
            <span className="footer-business-detail">
              사업자등록번호 : 214-86-12345&nbsp;|&nbsp;대표 : 최병아리&nbsp;|&nbsp;주소 : 서울특별시 강남구 테헤란로 411
            </span>
          </div>
        </div>
      </div>
      <p className="footer-copyright">&copy; 2026 Roomie. All rights reserved.</p>

      {showSocialModal && (
        <div className="footer-social-modal-backdrop" onClick={() => setShowSocialModal(false)}>
          <div
            className="footer-social-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="footer-social-modal-close"
              aria-label="닫기"
              onClick={() => setShowSocialModal(false)}
            >
              ×
            </button>
            <p className="footer-social-modal-text">아직 연결이 안됐습니다.</p>
          </div>
        </div>
      )}
    </footer>
  );
}

export default Footer;
