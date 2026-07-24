import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, KeyboardEvent, MouseEvent } from "react";
import { Link } from "react-router-dom";
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
import "./RecommendationPage.css";

const RECOMMENDATION_CARD_LIMIT = 3;

const getProfileImageSrc = (url: string | null) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
};

const getInitial = (nickname: string) => nickname.trim().charAt(0) || "?";

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
  const [recommendations, setRecommendations] = useState<RecommendationResult[] | null>(null);
  const [surveys, setSurveys] = useState<SurveyResult[] | null>(null);
  const [aiSurveyInsight, setAiSurveyInsight] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [comparison, setComparison] = useState<SurveyComparisonResult | null>(null);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [comparisonLoadingUserId, setComparisonLoadingUserId] = useState<number | null>(null);
  const [comparisonError, setComparisonError] = useState("");
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
        if (isMounted) {
          setRecommendations(result);
          setSelectedUserId(result[0]?.userId ?? null);
        }
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
  const selectedRecommendation =
    visibleRecommendations.find((item) => item.userId === selectedUserId) ?? visibleRecommendations[0] ?? null;
  const selectedScore = selectedRecommendation?.compatibilityScore ?? 0;
  const gaugePercent = Math.max(0, Math.min(selectedScore, 100));
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
  };

  return (
    <div className="recommendation-page">
      <section className="recommendation-summary">
        <div className="summary-title">나와 가장 잘 맞는 상대</div>
        <div className="compatibility-gauge" style={{ "--gauge-percent": `${gaugePercent}%` } as CSSProperties}>
          <div className="gauge-ring">
            <div className="gauge-center">
              <div className="compatibility-score">
                <span className="compatibility-score-value">{selectedScore}</span>
                <span className="compatibility-score-unit">%</span>
              </div>
              <div className="compatibility-label">호환성 점수</div>
            </div>
          </div>
        </div>
        <div className="summary-note">
          {selectedRecommendation
            ? `${selectedRecommendation.nickname}님과의 호환성은 ${selectedScore}% 입니다.`
            : "추천 데이터를 불러오는 중이거나 설문이 필요합니다."}
        </div>

        <div className="my-survey-summary">
          <div className="my-survey-header">
            <h3>AI 설문 요약</h3>
            <Link to="/mypage/activity" className="survey-summary-link">
              자세히 보기
            </Link>
          </div>

          {surveys === null && aiSurveyInsight === null ? (
            <p className="survey-summary-empty">설문 답변을 불러오는 중...</p>
          ) : (
            <p className="survey-insight">{surveyInsight}</p>
          )}
        </div>
      </section>

      <section className="recommendation-list">
        <div className="recommendation-header">
          <h1>호환성 높은 순</h1>
          <Link to="/survey" className="btn btn-outline">
            설문 다시 하기
          </Link>
        </div>

        {error && <p className="survey-error">{error}</p>}

        {recommendations === null ? (
          <p className="recommendation-empty">로딩 중...</p>
        ) : recommendations.length === 0 ? (
          <p className="recommendation-empty">추천 결과가 없습니다.</p>
        ) : (
          <>
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
                      {imageSrc ? (
                        <img className="profile-card-avatar" src={imageSrc} alt={item.nickname} />
                      ) : (
                        <div className="profile-card-avatar profile-card-avatar-fallback" aria-hidden="true">
                          {getInitial(item.nickname)}
                        </div>
                      )}

                      <div className="profile-card-info">
                        <h2>{item.nickname}</h2>
                        <p>
                          {item.age}세{item.job ? ` | ${item.job}` : " | 직업 정보 준비 중"}
                        </p>
                        <p>{item.region ?? "지역 정보 준비 중"}</p>
                      </div>
                    </div>

                    <div className="profile-card-tags">
                      {item.tags.length > 0 ? (
                        item.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="profile-card-tag">
                            #{tag}
                          </span>
                        ))
                      ) : (
                        <span className="profile-card-tag is-empty">태그 준비 중</span>
                      )}
                    </div>

                    <div className="profile-card-footer">
                      <strong>{item.compatibilityScore}%</strong>
                      <button
                        type="button"
                        className="profile-compare-button"
                        onClick={(event) => openComparison(event, item)}
                      >
                        호환성 점수 <span aria-hidden="true">&gt;</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="recommendation-more-cta">
              <div>
                <strong>더 많은 추천을 보고 싶으신가요?</strong>
                <p>모집 게시판에서 다양한 프로필과 방 정보를 더 둘러볼 수 있어요.</p>
              </div>
              <Link to="/board" className="btn btn-primary recommendation-more-link">
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
                  {comparison ? `${comparison.nickname}님과의 호환성` : "호환성 비교"}
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
                <div className="comparison-modal-score">
                  <strong>{comparison.compatibilityScore}%</strong>
                  <span>{comparison.nickname}님과 나의 설문 기반 호환성 점수</span>
                </div>

                <div className="comparison-highlight-grid">
                  <div className="comparison-highlight-panel">
                    <h3>잘 맞는 이유 TOP3</h3>
                    <ul>
                      {comparison.topReasons.map((item) => (
                        <li key={`reason-${item.category}`}>
                          <strong>{item.category}</strong>
                          <span>{item.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="comparison-highlight-panel">
                    <h3>다른점</h3>
                    <ul>
                      {comparison.differences.map((item) => (
                        <li key={`difference-${item.category}`}>
                          <strong>{item.category}</strong>
                          <span>{item.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="comparison-table-wrap">
                  <div className="comparison-table-header">
                    <h3>설문 답변 비교</h3>
                    <span>나와 {comparison.nickname}</span>
                  </div>
                  <div className="comparison-table">
                    <div className="comparison-table-row comparison-table-head">
                      <span>항목</span>
                      <span>나</span>
                      <span>{comparison.nickname}</span>
                      <span>차이</span>
                    </div>
                    {comparison.items.map((item) => (
                      <div key={item.questionId} className="comparison-table-row">
                        <span className="comparison-category">{item.category}</span>
                        <span>{item.myAnswer}</span>
                        <span>{item.otherAnswer}</span>
                        <span className={`comparison-level level-${item.difference}`}>
                          {item.matchLevel}
                        </span>
                      </div>
                    ))}
                  </div>
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
