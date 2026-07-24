import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRecommendations } from "../api";
import type { RecommendationResult } from "../types/survey";
import "./RecommendationPage.css";

function RecommendationPage() {
  const { token } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendationResult[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    getRecommendations(token)
      .then(setRecommendations)
      .catch(() => setError("추천 데이터를 불러오지 못했습니다."));
  }, [token]);

  const topScore = recommendations && recommendations.length > 0 ? recommendations[0].compatibilityScore : 0;

  const gaugePercent = Math.max(0, Math.min(topScore, 100));

  return (
    <div className="recommendation-page">
      <section className="recommendation-summary">
        <div className="summary-title">나와 가장 잘 맞는 상대</div>
        <div className="compatibility-gauge" style={{ "--gauge-percent": `${gaugePercent}%` } as React.CSSProperties}>
          <div className="gauge-ring">
            <div className="gauge-center">
              <div className="compatibility-score">
                <span className="compatibility-score-value">{topScore}</span>
                <span className="compatibility-score-unit">%</span>
              </div>
              <div className="compatibility-label">호환성 점수</div>
            </div>
          </div>
        </div>
        <div className="summary-note">
          {topScore > 0
            ? `DB 설문 결과 기반 매칭입니다. 가장 높은 호환성은 ${topScore}% 입니다.`
            : "추천 데이터를 불러오는 중이거나 설문이 필요합니다."}
        </div>
        <div className="match-traits">
          <h3>나의 매칭 성향</h3>
          <div className="trait-item">
            <span className="trait-label">수면 시간</span>
            <span className="trait-value">야행성</span>
          </div>
          <div className="trait-item">
            <span className="trait-label">청결 습관</span>
            <span className="trait-value">매우 깔끔</span>
          </div>
          <div className="trait-item">
            <span className="trait-label">소음 민감도</span>
            <span className="trait-value">보통</span>
          </div>
          <div className="trait-item">
            <span className="trait-label">외출 빈도</span>
            <span className="trait-value">낮음</span>
          </div>
          <div className="trait-item">
            <span className="trait-label">흡연 여부</span>
            <span className="trait-value">비흡연</span>
          </div>
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
          <p>로딩 중...</p>
        ) : recommendations.length === 0 ? (
          <p>추천 결과가 없습니다.</p>
        ) : (
          recommendations.map((item, index) => (
            <article key={item.userId} className="recommendation-item">
              <div className="recommendation-rank">{index + 1}</div>
              <div className="recommendation-profile">
                <img
                  className="profile-avatar"
                  src={item.profileImageUrl ?? "/default-avatar.png"}
                  alt={item.nickname}
                />
                <div className="profile-info">
                  <h2>{item.nickname}</h2>
                  <p>{item.age}세 · 비슷한 생활 패턴</p>
                  <p>{item.bio ?? "자기소개가 없습니다."}</p>
                  <div className="profile-tags">
                    {item.tags.map((tag) => (
                      <span key={tag} className="profile-tag">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="profile-actions">
                <div className="compatibility-badge">{item.compatibilityScore}%</div>
                <button className="btn btn-primary">프로필 보기</button>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

export default RecommendationPage;
