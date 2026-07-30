import { Link, useNavigate } from "react-router-dom";
import roomieLogo from "../assets/Roomie_logo.png";
import "./NotFoundPage.css";

function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      <div className="not-found-icon">
        <span className="not-found-question not-found-question-1" aria-hidden="true">
          ?
        </span>
        <span className="not-found-question not-found-question-2" aria-hidden="true">
          ?
        </span>
        <img src={roomieLogo} alt="Roomie" />
      </div>

      <h1 className="not-found-title">요청하신 페이지를 찾을 수 없어요</h1>
      <p className="not-found-subtitle">
        입력하신 주소가 정확한지 확인해주세요.
        <br />
        삭제되었거나 다른 주소로 바뀐 페이지일 수 있어요.
      </p>

      <div className="not-found-actions">
        <button type="button" className="not-found-back-button" onClick={() => navigate(-1)}>
          이전 페이지로
        </button>
        <Link to="/" className="not-found-home-button">
          홈으로 가기
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
