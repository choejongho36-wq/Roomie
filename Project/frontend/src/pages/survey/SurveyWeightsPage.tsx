import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getCategoryWeights, saveCategoryWeights } from "../../api";
import { surveyQuestions } from "../../data/SurveyQuestions";
import "./SurveyPage.css";
import "./SurveyWeightsPage.css";

const TIER_LABELS: Record<number, string> = { 1: "낮음", 2: "보통", 3: "높음" };

function SurveyWeightsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [weights, setWeights] = useState<Record<number, number>>(() =>
    Object.fromEntries(surveyQuestions.map((q) => [q.id, q.defaultWeight]))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    getCategoryWeights(token)
      .then((saved) => setWeights((prev) => ({ ...prev, ...saved })))
      .catch(() => {
        // 저장된 값이 없거나 조회 실패해도 기본값으로 진행하면 되니 조용히 무시
      });
  }, [token]);

  const handleFinish = async () => {
    if (!token) {
      navigate("/survey/complete");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await saveCategoryWeights(token, weights);
      navigate("/survey/complete");
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
          <p>각 항목이 나에게 얼마나 중요한지 정해주세요. 안 건드리면 추천 기본값 그대로 사용돼요.</p>
        </div>

        <ul className="survey-weights-list">
          {surveyQuestions.map((question) => (
            <li key={question.id} className="survey-weights-row">
              <span className="survey-weights-category">{question.category}</span>
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
          ))}
        </ul>

        {error && <p className="survey-error">{error}</p>}

        <div className="survey-weights-actions">
          <button type="button" className="btn btn-outline" onClick={() => navigate("/survey/complete")}>
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
