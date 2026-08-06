import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getCategoryWeights, getMySurveys, saveCategoryWeights } from "../../api";
import { surveyQuestions } from "../../data/SurveyQuestions";
import "./SurveyPage.css";
import "./SurveyWeightsPage.css";

const TIER_LABELS: Record<number, string> = { 1: "낮음", 2: "보통", 3: "높음" };

// 흡연은 CompatibilityCalculator 채점 루프에서 아예 제외되는 문항이라
// (실제 흡연 여부는 추천 필터링에만 쓰임) 가중치를 조절해도 점수에 영향이 없어 노출하지 않는다.
const SMOKING_QUESTION_ID = 12;
const weightableQuestions = surveyQuestions.filter((q) => q.id !== SMOKING_QUESTION_ID);

function SurveyWeightsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // 내 활동 > 설문 기록 페이지의 "가중치 설정하기" 버튼으로 들어온 경우, 끝나고
  // 나면 원래 있던 그 페이지로 돌아간다. 그 외(설문 완료 직후 등)는 기존과 동일.
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? "/survey/complete";

  const [weights, setWeights] = useState<Record<number, number>>(() =>
    Object.fromEntries(weightableQuestions.map((q) => [q.id, q.defaultWeight]))
  );
  const [myAnswers, setMyAnswers] = useState<number[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    getCategoryWeights(token)
      .then((saved) => setWeights((prev) => ({ ...prev, ...saved })))
      .catch(() => {
        // 저장된 값이 없거나 조회 실패해도 기본값으로 진행하면 되니 조용히 무시
      });
    // 방금 낸(혹은 가장 최근) 설문 응답을 함께 보여줘서, 이 화면에서 내 답을 다시 훑어볼 수 있게 한다.
    getMySurveys(token)
      .then((surveys) => setMyAnswers(surveys[0]?.answers ?? null))
      .catch(() => {});
  }, [token]);

  const handleFinish = async () => {
    if (!token) {
      navigate(returnTo);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await saveCategoryWeights(token, weights);
      navigate(returnTo);
    } catch {
      setError("저장에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="survey-page">
      <div className="survey-shell">
        <div className="survey-weights-header">
          <h1>얼마나 중요한가요?</h1>
          <p>내가 답한 내용을 다시 확인하면서, 각 항목이 나에게 얼마나 중요한지 정해주세요. 안 건드리면 추천 기본값 그대로 사용돼요.</p>
        </div>

        <ul className="survey-weights-list">
          {weightableQuestions.map((question) => {
            const myAnswerScore = myAnswers?.[question.id - 1];
            const myAnswerText = question.options.find((o) => o.score === myAnswerScore)?.text;
            return (
              <li key={question.id} className="survey-weights-row">
                <div className="survey-weights-info">
                  <span className="survey-weights-category">{question.category}</span>
                  {myAnswerText && <span className="survey-weights-answer">{myAnswerText}</span>}
                </div>
                <div className="survey-weights-tiers">
                  {[1, 2, 3].map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      className={`survey-weights-tier${weights[question.id] === tier ? " survey-weights-tier-selected" : ""}`}
                      onClick={() => setWeights((prev) => ({ ...prev, [question.id]: tier }))}
                      aria-pressed={weights[question.id] === tier}
                    >
                      {TIER_LABELS[tier]}
                    </button>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>

        {error && <p className="survey-error">{error}</p>}

        <div className="survey-weights-actions">
          <button type="button" className="btn btn-outline" onClick={() => navigate(returnTo)}>
            나중에 설정할게요
          </button>
          <button type="button" className="btn btn-primary" onClick={handleFinish} disabled={saving}>
            {saving ? "저장 중..." : "완료"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SurveyWeightsPage;
