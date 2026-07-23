import { Link } from "react-router-dom";
import "./SurveyPage.css";

function RecommendationPage() {
  return (
    <div className="survey-page">
      <div className="survey-shell survey-complete">
        <h1>추천 페이지</h1>
        <p>설문 결과를 바탕으로 매칭 추천을 보여줍니다.</p>
        <div className="survey-complete-actions">
          <Link to="/mypage/activity" className="btn btn-outline">
            내 활동으로 이동
          </Link>
          <Link to="/" className="btn btn-primary">
            홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RecommendationPage;
