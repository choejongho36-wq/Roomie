import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  API_ORIGIN,
  getMySurveySummary,
  getMySurveys,
  getRecommendations,
  getSurveyComparison,
} from "../api";
import { surveyQuestions } from "../data/SurveyQuestions";
import type { RecommendationResult, SurveyComparisonResult, SurveyResult } from "../types/survey";
import defaultAvatar from "../assets/Roomie_logo.png";
import "./RecommendationPage.css";

const RECOMMENDATION_CARD_LIMIT = 3;

const getProfileImageSrc = (url: string | null) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
};

const getSurveyScore = (survey: SurveyResult, questionId: number) => {
  const questionIndex = surveyQuestions.findIndex((question) => question.id === questionId);
  return questionIndex >= 0 ? survey.answers[questionIndex] : undefined;
};

const createSurveyInsight = (survey: SurveyResult | null) => {
  if (!survey) return "설문을 완료하면 AI가 생활 성향을 한 줄로 요약해드려요.";

  const cleanliness = getSurveyScore(survey, 1);
  const sleepTime = getSurveyScore(survey, 2);
  const noise = getSurveyScore(survey, 5);
  const smoking = getSurveyScore(survey, 13);

  const traits: string[] = [];

  if (cleanliness && cleanliness >= 4) traits.push("정돈된 공간을 선호하는");
  else if (cleanliness && cleanliness <= 2) traits.push("편안한 생활감을 중요하게 여기는");

  if (sleepTime && sleepTime <= 2) traits.push("늦은 시간대에 생활하는");
  else if (sleepTime && sleepTime >= 4) traits.push("규칙적인 수면 리듬을 가진");

  if (noise && noise >= 4) traits.push("조용한 환경에서 안정감을 느끼는");
  else if (noise && noise <= 2) traits.push("생활 소음에 비교적 유연한");

  if (smoking && smoking >= 5) traits.push("비흡연 환경을 선호하는");

  if (traits.length === 0) {
    return "AI 요약: 상황에 맞춰 생활 방식을 조율하는 균형형 룸메이트 성향이에요.";
  }

  return `AI 요약: ${traits.slice(0, 3).join(", ")} 룸메이트 성향이에요.`;
};

function RecommendationPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<RecommendationResult[] | null>(null);
  const [surveys, setSurveys] = useState<SurveyResult[] | null>(null);
  const [aiSurveyInsight, setAiSurveyInsight] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [comparison, setComparison] = useState<SurveyComparisonResult | null>(null);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [comparisonLoadingUserId, setComparisonLoadingUserId] = useState<number | null>(null);
  const [comparisonError, setComparisonError] = useState("");
  const [highlightedCategory, setHighlightedCategory] = useState<string | null>(null);
  const [error, setError] = useState("");
  const comparisonItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setAiSurveyInsight(null);
    if (!token) {
      setRecommendations(null);
      setSurveys(null);
      setSelectedUserId(null);
      setComparison(null);
      setIsComparisonOpen(false);
      return;
    }

    let isMounted = true;

    getRecommendations(token)
      .then((result) => {
        if (isMounted) setRecommendations(result);
      })
      .catch(() => {
        if (isMounted) setError("추천 데이터를 불러오지 못했습니다.");
      });

    getMySurveys(token)
      .then((result) => {
        if (isMounted) setSurveys(result);
      })
      .catch(() => {
        if (isMounted) setSurveys([]);
      });

    getMySurveySummary(token)
      .then((result) => {
        if (isMounted) setAiSurveyInsight(result.summary);
      })
      .catch(() => {
        if (isMounted) setAiSurveyInsight(null);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const visibleRecommendations = recommendations?.slice(0, RECOMMENDATION_CARD_LIMIT) ?? [];
  const selectedRecommendation = visibleRecommendations.find((item) => item.userId === selectedUserId) ?? null;
  const selectedScore = selectedRecommendation?.compatibilityScore ?? 0;

  const [displayedScore, setDisplayedScore] = useState(selectedScore);
  const displayedScoreRef = useRef(selectedScore);

  useEffect(() => {
    const start = displayedScoreRef.current;
    const end = selectedScore;
    if (start === end) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      displayedScoreRef.current = end;
      setDisplayedScore(end);
      return;
    }

    const duration = 600;
    const startTime = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(start + (end - start) * eased);
      displayedScoreRef.current = value;
      setDisplayedScore(value);
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [selectedScore]);

  const gaugePercent = Math.max(0, Math.min(displayedScore, 100));
  const latestSurvey = surveys?.[0] ?? null;
  const localSurveyInsight = useMemo(() => createSurveyInsight(latestSurvey), [latestSurvey]);
  const surveyInsight = aiSurveyInsight ?? localSurveyInsight;

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>, userId: number) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    setSelectedUserId(userId);
  };

  const openComparison = (event: MouseEvent<HTMLButtonElement>, item: RecommendationResult) => {
    event.stopPropagation();
    if (!token) return;

    setSelectedUserId(item.userId);
    setIsComparisonOpen(true);
    setComparison(null);
    setComparisonError("");
    setComparisonLoadingUserId(item.userId);

    getSurveyComparison(token, item.userId)
      .then(setComparison)
      .catch(() => setComparisonError("설문 비교 데이터를 불러오지 못했습니다."))
      .finally(() => setComparisonLoadingUserId(null));
  };

  const closeComparison = () => {
    setIsComparisonOpen(false);
    setComparisonError("");
    setComparisonLoadingUserId(null);
    setHighlightedCategory(null);
  };

  const scrollToCategory = (category: string) => {
    const target = comparisonItemRefs.current[category];
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "start" });
    setHighlightedCategory(category);

    if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    highlightTimeoutRef.current = setTimeout(() => setHighlightedCategory(null), 1800);
  };

  return (
    <div className={`recommendation-page${selectedRecommendation ? "" : " recommendation-page-solo"}`}>
      {selectedRecommendation && (
        <section className="recommendation-summary">
          <div className="summary-title">매칭 요약</div>
          <div className="compatibility-gauge" style={{ "--gauge-percent": `${gaugePercent}%` } as CSSProperties}>
            <div className="gauge-ring">
              <div className="gauge-center">
                <div className="compatibility-score">
                  <span className="compatibility-score-value">{displayedScore}</span>
                  <span className="compatibility-score-unit">점</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="summary-compare-button"
            onClick={(event) => openComparison(event, selectedRecommendation)}
          >
            {selectedRecommendation.nickname}님과 자세히 비교
          </button>

          <div className="my-survey-summary">
            <div className="my-survey-header">
              <h3>AI 설문 요약</h3>
            </div>

            {surveys === null && aiSurveyInsight === null ? (
              <p className="survey-summary-empty">설문 답변을 불러오는 중...</p>
            ) : (
              <p className="survey-insight">{surveyInsight}</p>
            )}
          </div>
        </section>
      )}

      <section className="recommendation-list">
        <p className="recommendation-hint">프로필 카드를 선택하면 궁합 점수를 확인할 수 있어요.</p>

        {error && <p className="survey-error">{error}</p>}

        {recommendations === null ? (
          <p className="recommendation-empty">로딩 중...</p>
        ) : recommendations.length === 0 ? (
          <p className="recommendation-empty">추천 결과가 없습니다.</p>
        ) : (
          <>
            <div className="recommendation-stage">
              <div className="recommendation-header">
                <h1>점수 높은 순</h1>
              </div>
              <div className="recommendation-cards">
                {visibleRecommendations.map((item) => {
                  const imageSrc = getProfileImageSrc(item.profileImageUrl);
                  const isSelected = selectedRecommendation?.userId === item.userId;

                  return (
                    <article
                      key={item.userId}
                      className={`recommendation-card${isSelected ? " is-selected" : ""}`}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected}
                      aria-label={`${item.nickname} 추천 카드 선택`}
                      onClick={() => setSelectedUserId(item.userId)}
                      onKeyDown={(event) => handleCardKeyDown(event, item.userId)}
                    >
                      <div className="profile-card-main">
                        <img className="profile-card-avatar" src={imageSrc ?? defaultAvatar} alt={item.nickname} />

                        <div className="profile-card-info">
                          <h2>{item.nickname}</h2>
                          <p>{item.age}세</p>
                          <p>
                            <span>{item.job}</span>
                            <span>{item.region}</span>
                          </p>
                        </div>
                      </div>

                      <p className="profile-card-bio">
                        {item.bio && item.bio.trim() ? item.bio : "아직 소개글이 없어요."}
                      </p>

                      <div className="profile-card-tags">
                        {item.tags.length > 0 ? (
                          item.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="profile-card-tag">
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="profile-card-tag is-empty">태그 준비 중</span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="recommendation-more-cta">
              <div>
                <strong>더 많은 추천을 보고 싶으신가요?</strong>
                <p>모집 게시판에서 다양한 프로필과 방 정보를 더 둘러볼 수 있어요.</p>
              </div>
              <Link to="/profiles" className="btn btn-primary recommendation-more-link">
                더 많은 프로필 보기
              </Link>
            </div>
          </>
        )}
      </section>

      {isComparisonOpen && (
        <div className="comparison-modal-backdrop" onClick={closeComparison}>
          <section
            className="comparison-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="comparison-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="comparison-modal-header">
              <div>
                <p className="comparison-modal-eyebrow">설문 비교</p>
                <h2 id="comparison-title">
                  {comparison ? (
                    <>
                      {comparison.nickname}님과의 궁합
                      <span className="comparison-modal-score-inline">{comparison.compatibilityScore}점</span>
                    </>
                  ) : (
                    "궁합 비교"
                  )}
                </h2>
              </div>
              <button type="button" className="comparison-modal-close" onClick={closeComparison}>
                닫기
              </button>
            </div>

            {comparisonLoadingUserId !== null && (
              <p className="comparison-modal-state">비교 데이터를 불러오는 중...</p>
            )}

            {comparisonError && <p className="comparison-modal-error">{comparisonError}</p>}

            {comparison && (
              <>
                <div className="comparison-highlight-grid">
                  <div className="comparison-highlight-panel comparison-highlight-panel-compact">
                    <h3>맞는 포인트 TOP3</h3>
                    <div className="comparison-highlight-chips">
                      {comparison.topReasons.map((item) => (
                        <button
                          key={`reason-${item.category}`}
                          type="button"
                          className="comparison-highlight-chip"
                          onClick={() => scrollToCategory(item.category)}
                        >
                          {item.category}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="comparison-highlight-panel comparison-highlight-panel-compact">
                    <h3>다른 포인트 TOP3</h3>
                    <div className="comparison-highlight-chips">
                      {comparison.differences.map((item) => (
                        <button
                          key={`difference-${item.category}`}
                          type="button"
                          className="comparison-highlight-chip comparison-highlight-chip-diff"
                          onClick={() => scrollToCategory(item.category)}
                        >
                          {item.category}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="comparison-table-wrap">
                  <div className="comparison-compare-grid">
                    {comparison.items.map((item) => (
                      <div
                        key={item.questionId}
                        ref={(el) => {
                          comparisonItemRefs.current[item.category] = el;
                        }}
                        className={`comparison-compare-card${
                          item.category === highlightedCategory ? " is-target" : ""
                        }`}
                      >
                        <div className="comparison-compare-card-header">
                          <span className="comparison-compare-category">{item.category}</span>
                          <span className={`comparison-level level-${item.difference}`}>
                            {item.matchLevel}
                          </span>
                        </div>
                        <div className="comparison-compare-answer">
                          <span className="comparison-compare-answer-label">나</span>
                          <span className="comparison-compare-answer-value">{item.myAnswer}</span>
                        </div>
                        <div className="comparison-compare-answer">
                          <span className="comparison-compare-answer-label">{comparison.nickname}</span>
                          <span className="comparison-compare-answer-value">{item.otherAnswer}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="comparison-modal-footer">
                  <button
                    type="button"
                    className="btn btn-primary comparison-start-chat-button"
                    onClick={() =>
                      navigate(`/mypage/chat?userId=${comparison.userId}`, {
                        state: { nickname: comparison.nickname },
                      })
                    }
                  >
                    {comparison.nickname}님에게 첫 메시지 보내기
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default RecommendationPage;
