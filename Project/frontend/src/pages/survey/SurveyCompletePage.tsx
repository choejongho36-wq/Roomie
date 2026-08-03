import { Link } from "react-router-dom";
import { Icon } from "../../components/mypage/MyPageSidebar";
import "./SurveyPage.css";

function SurveyCompletePage() {
  return (
    <div className="survey-page">
      <div className="survey-shell survey-complete">
        <h1>설문이 완료되었어요!</h1>
        <p>응답해주신 내용은 룸메이트 매칭에 활용돼요.</p>
        <div className="survey-complete-actions">
          <Link to="/recommend" className="survey-complete-banner survey-complete-banner-primary">
            <span className="survey-complete-banner-icon">
              <Icon name="heart" />
            </span>
            <span className="survey-complete-banner-text">
              <strong>내 매칭 상대 확인하기</strong>
              <span>궁합 점수로 나와 잘 맞는 룸메이트를 바로 보여드려요</span>
            </span>
            <span className="survey-complete-banner-arrow" aria-hidden="true">›</span>
          </Link>

          <Link to="/mypage/activity" className="survey-complete-banner">
            <span className="survey-complete-banner-icon">
              <Icon name="clock" />
            </span>
            <span className="survey-complete-banner-text">
              <strong>내가 뭐라고 답했는지 보기</strong>
              <span>방금 제출한 설문 응답을 내 활동에서 다시 확인할 수 있어요</span>
            </span>
            <span className="survey-complete-banner-arrow" aria-hidden="true">›</span>
          </Link>

          <Link to="/" className="survey-complete-banner">
            <span className="survey-complete-banner-icon">
              <Icon name="home" />
            </span>
            <span className="survey-complete-banner-text">
              <strong>나중에 둘러볼게요</strong>
              <span>설문 결과는 저장돼 있으니 언제든 다시 매칭을 확인할 수 있어요</span>
            </span>
            <span className="survey-complete-banner-arrow" aria-hidden="true">›</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SurveyCompletePage;
