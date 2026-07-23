import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMySurveys } from "../../api";
import type { SurveyResult } from "../../types/survey";
import { surveyQuestions } from "../../data/SurveyQuestions";
import "./MyPageContent.css";

function ActivityPage() {
  const { token } = useAuth();
  const [surveys, setSurveys] = useState<SurveyResult[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    getMySurveys(token)
      .then(setSurveys)
      .catch(() => setError("설문 기록을 불러오지 못했습니다."));
  }, [token]);

  return (
    <div className="mypage-panel">
      <h1 className="mypage-panel-title">내 활동</h1>
      <p className="mypage-panel-desc">완료한 매칭 설문 기록을 확인할 수 있어요.</p>

      {error && <p className="mypage-error">{error}</p>}

      {surveys && surveys.length === 0 && (
        <div className="mypage-empty">
          <p>아직 완료한 설문이 없어요.</p>
          <Link to="/survey" className="btn btn-primary">
            설문 시작하기
          </Link>
        </div>
      )}

      {surveys && surveys.length > 0 && (
        <div className="survey-history">
          {surveys.map((survey) => (
            <div key={survey.id} className="survey-history-item">
              <div className="survey-history-header">
                <p className="survey-history-date">
                  {new Date(survey.completedAt).toLocaleString("ko-KR")}
                </p>
                <Link to="/survey" className="btn btn-outline">
                  다시 하기
                </Link>
              </div>
              <ul className="survey-history-answers">
                {survey.answers.map((score, i) => {
                  const question = surveyQuestions[i];
                  if (!question) return null;
                  const option = question.options.find((o) => o.score === score);
                  return (
                    <li key={question.id}>
                      <span className="survey-history-category">{question.category}</span>
                      <span>{option?.text ?? "-"}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ActivityPage;
