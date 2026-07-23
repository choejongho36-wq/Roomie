import { Link } from "react-router-dom";
import "./MyPageContent.css";

function ActivityPage() {
  return (
    <div className="mypage-panel">
      <h1 className="mypage-panel-title">내 활동</h1>
      <p className="mypage-panel-desc">완료한 매칭 설문 기록을 확인할 수 있어요.</p>

      <div className="mypage-empty">
        <p>아직 완료한 설문이 없어요.</p>
        <Link to="/survey" className="btn btn-primary">
          설문 시작하기
        </Link>
      </div>
    </div>
  );
}

export default ActivityPage;
