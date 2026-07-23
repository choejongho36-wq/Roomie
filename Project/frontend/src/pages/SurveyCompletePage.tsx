import { Link } from "react-router-dom";
import "./SurveyPage.css";

function SurveyCompletePage() {
  return (
    <div className="survey-page">
      <div className="survey-shell survey-complete">
        <h1>설문이 완료되었어요!</h1>
        <p>응답해주신 내용은 룸메이트 매칭에 활용돼요.</p>
        <div className="survey-complete-actions">
          <Link to="/mypage/activity" className="btn btn-outline">
            내 활동에서 확인하기
          </Link>
          <Link to="/" className="btn btn-primary">
            홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SurveyCompletePage;
