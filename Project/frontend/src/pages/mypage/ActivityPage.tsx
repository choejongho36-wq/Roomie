import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMySurveys, updateSurveyAnswer, getCategoryWeights, saveCategoryWeights } from "../../api";
import type { SurveyResult } from "../../types/survey";
import { surveyQuestions, SMOKING_QUESTION_ID } from "../../data/SurveyQuestions";
import "./MyPageContent.css";
import "./ActivityPage.css";

const TIER_LABELS: Record<number, string> = { 1: "낮음", 2: "보통", 3: "높음" };

function ActivityPage() {
  const { token, user } = useAuth();
  const name = user?.nickname ?? "회원";
  const [survey, setSurvey] = useState<SurveyResult | null | undefined>(undefined);
  const [error, setError] = useState("");
  // 지금 "다시 고르기"로 편집 중인 문항 index (한 번에 하나만 열림)
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [showOverview, setShowOverview] = useState(false);
  const [weights, setWeights] = useState<Record<number, number>>(() =>
    Object.fromEntries(surveyQuestions.map((q) => [q.id, q.defaultWeight]))
  );
  const [savingWeightId, setSavingWeightId] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!token) return;
    getMySurveys(token)
      .then((data) => setSurvey(data[0] ?? null))
      .catch(() => setError("설문 기록을 불러오지 못했습니다."));
    getCategoryWeights(token)
      .then((saved) => setWeights((prev) => ({ ...prev, ...saved })))
      .catch(() => {
        // 저장된 가중치가 없으면 기본값을 그대로 보여주면 되니 조용히 무시
      });
  }, [token]);

  // 카드 위에서 마우스 휠(세로 스크롤)을 굴리면, 스크롤바 손잡이를 직접 잡고 끄는 것처럼
  // 휠이 움직인 만큼 카드 트랙이 그 즉시 1:1로 따라 움직이게 한다(애니메이션/카드 단위 이동 없음).
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [survey]);

  const handleReselect = async (index: number, score: number) => {
    if (!token) return;
    setSavingIndex(index);
    setError("");
    try {
      const updated = await updateSurveyAnswer(token, index, score);
      setSurvey(updated);
      setEditingIndex(null);
    } catch {
      setError("답변을 변경하지 못했습니다.");
    } finally {
      setSavingIndex(null);
    }
  };

  const handleWeightChange = async (questionId: number, tier: number) => {
    if (!token) return;
    setSavingWeightId(questionId);
    setError("");
    try {
      await saveCategoryWeights(token, { [questionId]: tier });
      setWeights((prev) => ({ ...prev, [questionId]: tier }));
    } catch {
      setError("중요도를 변경하지 못했습니다.");
    } finally {
      setSavingWeightId(null);
    }
  };

  return (
    <div className="mypage-panel">
      <h1 className="mypage-panel-title">설문 기록</h1>
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
        <>
          <div className="survey-record-header-actions">
            <div className="survey-record-header-buttons">
              <Link to="/survey" className="survey-record-btn survey-record-btn-outline">
                설문 다시하기
              </Link>
              <Link
                to="/survey/weights"
                state={{ returnTo: "/mypage/activity" }}
                className="survey-record-btn"
              >
                가중치 설정하기
              </Link>
              <button type="button" className="survey-record-btn" onClick={() => setShowOverview(true)}>
                한눈에 보기
              </button>
            </div>
            <span className="survey-record-date">
              {new Date(survey.completedAt).toLocaleString("ko-KR")} 완료
            </span>
          </div>

          <div className="survey-record-track" ref={trackRef}>
            {survey.answers.map((score, index) => {
              const question = surveyQuestions[index];
              if (!question) return null;
              const isEditing = editingIndex === index;
              const isSaving = savingIndex === index;
              const questionText = question.question.replace("{name}", name);

              const weightTier = weights[question.id] ?? question.defaultWeight;
              const isSavingWeight = savingWeightId === question.id;
              // 흡연 문항은 궁합 점수 계산에서 아예 빠지기 때문에(추천 필터링에만 쓰임) 중요도를
              // 바꿔도 아무 효과가 없다. 다른 가중치 설정 화면과 동일하게 여기서도 숨긴다.
              const isWeightable = question.id !== SMOKING_QUESTION_ID;

              return (
                <section className="survey-record-card" key={question.id}>
                  <div className="survey-record-card-top">
                    <span className="survey-record-category">
                      {question.category}
                    </span>
                    {isWeightable &&
                      (isEditing ? (
                        <div className="survey-record-weight-editor">
                          {[1, 2, 3].map((tier) => (
                            <button
                              key={tier}
                              type="button"
                              disabled={isSavingWeight}
                              className={`survey-record-weight-tier${
                                weightTier === tier ? " survey-record-weight-tier-selected" : ""
                              }`}
                              onClick={() => handleWeightChange(question.id, tier)}
                            >
                              {TIER_LABELS[tier]}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="survey-record-weight-badge">중요도 {TIER_LABELS[weightTier]}</span>
                      ))}
                  </div>

                  <p className="survey-record-question">{questionText}</p>

                  <div className="survey-record-options">
                    {question.options.map((option) => {
                      const selected = option.score === score;
                      return (
                        <button
                          key={option.score}
                          type="button"
                          aria-disabled={!isEditing}
                          aria-pressed={selected}
                          className={`survey-record-option${selected ? " survey-record-option-selected" : ""}${
                            isEditing ? " survey-record-option-editable" : ""
                          }`}
                          onClick={() => {
                            if (isEditing && !isSaving) handleReselect(index, option.score);
                          }}
                        >
                          {option.text}
                        </button>
                      );
                    })}
                  </div>

                  <div className="survey-record-actions">
                    <button
                      type="button"
                      className="survey-record-btn"
                      disabled={isSaving}
                      onClick={() => setEditingIndex(isEditing ? null : index)}
                    >
                      {isSaving ? "저장 중..." : isEditing ? "그만 고르기" : "다시 고르기"}
                    </button>
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}

      {survey && showOverview && (
        <div className="survey-overview-backdrop" onClick={() => setShowOverview(false)}>
          <div className="survey-overview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="survey-overview-header">
              <h2 className="survey-overview-title">설문 기록 한눈에 보기</h2>
              <button
                type="button"
                className="survey-overview-close"
                aria-label="닫기"
                onClick={() => setShowOverview(false)}
              >
                ×
              </button>
            </div>
            <ul className="survey-overview-grid">
              {survey.answers.map((score, index) => {
                const question = surveyQuestions[index];
                if (!question) return null;
                const option = question.options.find((o) => o.score === score);
                return (
                  <li key={question.id} className="survey-overview-tile">
                    <span className="survey-overview-tile-category">{question.category}</span>
                    <p className="survey-overview-tile-detail">{option?.text ?? "-"}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActivityPage;
