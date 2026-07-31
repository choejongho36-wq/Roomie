import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  API_ORIGIN,
  getMySurveySummary,
  getMySurveys,
  getRecommendations,
  getSurveyComparison,
  getSurveyComparisonAiExplanation,
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
  const location = useLocation();
  const [recommendations, setRecommendations] = useState<RecommendationResult[] | null>(null);
  const [surveys, setSurveys] = useState<SurveyResult[] | null>(null);
  const [aiSurveyInsight, setAiSurveyInsight] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [comparison, setComparison] = useState<SurveyComparisonResult | null>(null);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [comparisonLoadingUserId, setComparisonLoadingUserId] = useState<number | null>(null);
  const [comparisonError, setComparisonError] = useState("");
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiExplanationLoading, setAiExplanationLoading] = useState(false);
  const [aiExplanationError, setAiExplanationError] = useState("");
  const [error, setError] = useState("");

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

  // 네비바의 "매칭" 버튼은 이미 /recommend 페이지에 있어도 다시 navigate("/recommend")를 호출한다.
  // 같은 라우트라 컴포넌트가 리마운트되지 않아 selectedUserId 등 이전 선택 상태가 그대로 남기 때문에,
  // location.key(내비게이션마다 새로 발급되는 값)가 바뀔 때마다 선택 상태를 초기화해서
  // "매칭"을 다시 눌렀을 때 처음 화면(매칭 요약 없는 상태)으로 돌아가도록 한다.
  useEffect(() => {
    setSelectedUserId(null);
    setIsComparisonOpen(false);
    setComparison(null);
    setComparisonError("");
    setComparisonLoadingUserId(null);
    setAiExplanation(null);
    setAiExplanationError("");
    setAiExplanationLoading(false);
  }, [location.key]);

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
    setAiExplanation(null);
    setAiExplanationError("");
    setAiExplanationLoading(false);

    getSurveyComparison(token, item.userId)
      .then((result) => {
        setComparison(result);
        setAiExplanationLoading(true);
        getSurveyComparisonAiExplanation(token, item.userId)
          .then((res) => setAiExplanation(res.explanation))
          .catch(() => setAiExplanationError("AI 설명을 불러오지 못했어요."))
          .finally(() => setAiExplanationLoading(false));
      })
      .catch(() => setComparisonError("설문 비교 데이터를 불러오지 못했습니다."))
      .finally(() => setComparisonLoadingUserId(null));
  };

  const closeComparison = () => {
    setIsComparisonOpen(false);
    setComparisonError("");
    setComparisonLoadingUserId(null);
    setAiExplanation(null);
    setAiExplanationError("");
    setAiExplanationLoading(false);
  };

  return (
    <div className={`recommendation-page${selectedRecommendation ? "" : " recommendation-page-solo"}`}>
      {selectedRecommendation && (
        <section className="recommendation-summary">
          <div className="recommendation-summary-title">매칭 요약</div>
          <div className="recommendation-compatibility-gauge" style={{ "--gauge-percent": `${gaugePercent}%` } as CSSProperties}>
            <div className="recommendation-gauge-ring">
              <div className="recommendation-gauge-center">
                <div className="recommendation-compatibility-score">
                  <span className="recommendation-compatibility-score-value">{displayedScore}</span>
                  <span className="recommendation-compatibility-score-unit">점</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="recommendation-summary-compare-button"
            onClick={(event) => openComparison(event, selectedRecommendation)}
          >
            {selectedRecommendation.nickname}님과 자세히 비교
          </button>

          <div className="recommendation-my-survey-summary">
            <div className="recommendation-my-survey-header">
              <h3>AI 설문 요약</h3>
            </div>

            {surveys === null && aiSurveyInsight === null ? (
              <p className="recommendation-survey-summary-empty">설문 답변을 불러오는 중...</p>
            ) : (
              <p className="recommendation-survey-insight">{surveyInsight}</p>
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
                      <div className="recommendation-card-main">
                        <img className="recommendation-card-avatar" src={imageSrc ?? defaultAvatar} alt={item.nickname} />

                        <div className="recommendation-card-info">
                          <h2>
                            {item.nickname}
                            {item.emailVerified && (
                              <span className="verified-badge" title="이메일 인증 완료" aria-label="이메일 인증 완료">
                                <svg width="16" height="18" viewBox="0 0 18 20" fill="none" aria-hidden="true">
                                  <path
                                    d="M9 1l7 2.6v5.2c0 5-3 8.4-7 10.2-4-1.8-7-5.2-7-10.2V3.6L9 1z"
                                    fill="currentColor"
                                  />
                                  <path
                                    d="M5.8 9.6l2.3 2.3L12.4 7"
                                    stroke="#fff"
                                    strokeWidth="1.6"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </span>
                            )}
                          </h2>
                          <p className="recommendation-card-meta">
                            {item.age}세
                            {" · "}
                            {item.job ?? "직업 정보 준비 중"}
                            {" · "}
                            {item.region ?? "지역 정보 준비 중"}
                          </p>
                        </div>
                      </div>

                      <p className="recommendation-card-bio">
                        {item.bio && item.bio.trim() ? item.bio : "아직 소개글이 없어요."}
                      </p>

                      <div className="recommendation-card-tags">
                        {item.tags.length > 0 ? (
                          item.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="recommendation-card-tag">
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="recommendation-card-tag is-empty">태그 준비 중</span>
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
              <button type="button" className="comparison-modal-close" onClick={closeComparison}>
                닫기
              </button>
            </div>

            {comparisonLoadingUserId !== null && (
              <p className="comparison-modal-state">비교 데이터를 불러오는 중...</p>
            )}

            {comparisonError && <p className="comparison-modal-error">{comparisonError}</p>}

            {comparison && (
              <div className="comparison-modal-body">
                <div className="comparison-modal-grid">
                  <div className="comparison-panel comparison-panel-compare">
                    <div className="comparison-panel-header">
                      <p className="comparison-panel-title" id="comparison-title">
                        {comparison.nickname}님과의 궁합
                      </p>
                      <div
                        className="comparison-gauge"
                        style={
                          {
                            "--gauge-percent": `${Math.max(0, Math.min(comparison.compatibilityScore, 100))}%`,
                          } as CSSProperties
                        }
                      >
                        <div className="comparison-gauge-ring">
                          <div className="comparison-gauge-center">
                            <div className="comparison-gauge-score">
                              <span className="comparison-gauge-score-value">{comparison.compatibilityScore}</span>
                              <span className="comparison-gauge-score-unit">점</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="comparison-points-grid">
                      <div>
                        <p className="comparison-points-label">맞는 포인트</p>
                        <div className="comparison-points-list">
                          {comparison.topReasons.map((item) => (
                            <span key={`reason-${item.category}`} className="comparison-point-chip">
                              {item.category}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="comparison-points-label">다른 포인트</p>
                        <div className="comparison-points-list">
                          {comparison.differences.map((item) => (
                            <span
                              key={`difference-${item.category}`}
                              className="comparison-point-chip comparison-point-chip-diff"
                            >
                              {item.category}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="comparison-panel comparison-panel-profile">
                    <img
                      className="comparison-profile-avatar"
                      src={getProfileImageSrc(selectedRecommendation?.profileImageUrl ?? null) ?? defaultAvatar}
                      alt={comparison.nickname}
                    />
                    <p className="comparison-profile-name">{comparison.nickname}</p>
                    <p className="comparison-profile-meta">
                      {selectedRecommendation?.age}세 · {selectedRecommendation?.job} · {selectedRecommendation?.region}
                    </p>
                    <p className="comparison-profile-bio">
                      {selectedRecommendation?.bio && selectedRecommendation.bio.trim()
                        ? selectedRecommendation.bio
                        : "아직 소개글이 없어요."}
                    </p>
                    {selectedRecommendation && selectedRecommendation.tags.length > 0 && (
                      <div className="comparison-profile-tags">
                        {selectedRecommendation.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="comparison-profile-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="comparison-ai-explanation">
                  <p className="comparison-ai-label">AI 궁합 설명</p>
                  {aiExplanationLoading ? (
                    <p className="comparison-ai-loading">AI가 설명을 작성하고 있어요...</p>
                  ) : aiExplanationError ? (
                    <p className="comparison-ai-error">{aiExplanationError}</p>
                  ) : (
                    <p className="comparison-ai-text">{aiExplanation}</p>
                  )}
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
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default RecommendationPage;
