import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMySurveys } from "../../api";
import type { SurveyResult } from "../../types/survey";
import { surveyQuestions } from "../../data/SurveyQuestions";
import "./MyPageContent.css";

function ActivityPage() {
  const { token } = useAuth();
  const [survey, setSurvey] = useState<SurveyResult | null | undefined>(undefined);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    getMySurveys(token)
      .then((data) => setSurvey(data[0] ?? null))
      .catch(() => setError("설문 기록을 불러오지 못했습니다."));
  }, [token]);

  return (
    <div className="mypage-panel">
      <h1 className="mypage-panel-title">내 활동</h1>
      <p className="mypage-panel-desc">완료한 매칭 설문 기록을 확인할 수 있어요.</p>

      {error && <p className="mypage-error">{error}</p>}

      {survey === null && (
        <div className="mypage-empty">
          <p>아직 완료한 설문이 없어요.</p>
          <Link to="/survey" className="btn btn-primary">
            설문 시작하기
          </Link>
        </div>
      )}

      {survey && (
        <div className="activity-history">
          <div className="activity-history-header">
            <span className="activity-history-date">
              {new Date(survey.completedAt).toLocaleString("ko-KR")}
            </span>
            <Link to="/survey" className="btn btn-outline">
              다시 하기
            </Link>
          </div>

          <ul className="activity-grid">
            {survey.answers.map((score, i) => {
              const question = surveyQuestions[i];
              if (!question) return null;
              const option = question.options.find((o) => o.score === score);
              return (
                <li key={question.id} className="activity-tile">
                  <span className="activity-tile-category">{question.category}</span>
                  <p className="activity-tile-detail">{option?.text ?? "-"}</p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ActivityPage;
