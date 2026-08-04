import { useState } from "react";
import type { CSSProperties } from "react";
import "./MainPage.css";
import logo from "../assets/Roomie_logo2.png";
import sampleAvatar from "../assets/Roomie_logo.png";
import { useAuth } from "../context/AuthContext";
import LoginModal from "../components/LoginModal";
import MatchingLoadingOverlay from "../components/MatchingLoadingOverlay";
import { useInView } from "../hooks/useInView";
import { useMatchingRedirect } from "../hooks/useMatchingRedirect";

const overallMatch = 92;
const matchingPoints = ["생활 패턴", "청결도", "가치관"];
const differingPoints = ["취침 시간", "흡연 여부"];
const sampleProfile = {
  name: "지민",
  meta: "27세 · 직장인",
  bio: "평온한 환경에서 함께 지내는 걸 선호해요.",
  tags: ["영화감상", "산책", "요리"],
};
const sampleAiExplanation =
  "지민 님과 상대방은 생활 패턴, 청결도, 가치관에서 좋은 호흡을 보여 92점의 높은 궁합을 기록했어요. " +
  "취침 시간과 흡연 여부는 다소 차이가 있으니, 서로의 습관을 미리 공유하면 더욱 편안한 생활이 될 거예요.";

const steps = [
  {
    icon: <path d="M4 20l1-4 11-11 3 3-11 11-4 1zM14 6l3 3" />,
    title: "프로필 작성",
    body: "생활 패턴과 선호도를\n자세히 입력해요.",
  },
  {
    icon: (
      <>
        <rect x="5" y="7" width="14" height="12" rx="2" />
        <path d="M9 7V5a3 3 0 0 1 6 0v2M9 12h.01M15 12h.01" />
      </>
    ),
    title: "AI가 분석",
    body: "AI가 당신의 정보를 분석하여\n최적의 매칭을 준비해요.",
  },
  {
    icon: (
      <>
        <circle cx="9" cy="8" r="3" />
        <circle cx="16" cy="9" r="2.5" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M14.5 14.2c2.5.3 4.5 2.4 4.5 5.8" />
      </>
    ),
    title: "룸메이트 추천",
    body: "가장 잘 맞는 룸메이트를\n추천받아요.",
  },
  {
    icon: <path d="M4 5h16v11H8l-4 4z" />,
    title: "채팅으로 연결",
    body: "채팅으로 서로를 알아가고\n함께 살아볼 수 있어요.",
  },
];

const features = [
  {
    icon: (
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    ),
    title: "생활 패턴 매칭",
    body: "수면 시간, 기상 시간 등\n일상 패턴을 분석해요.",
  },
  {
    icon: (
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    ),
    title: "청결도 & 공간관리",
    body: "청결도 기준과 정리 습관까지\n세심하게 맞춰드려요.",
  },
  {
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M5.64 5.64l12.72 12.72" />
      </>
    ),
    title: "흡연·음주 성향",
    body: "흡연 여부, 음주 빈도까지\n솔직하게 설정할 수 있어요.",
  },
  {
    icon: (
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    ),
    title: "선호하는 분위기",
    body: "조용한 환경, 함께하는 시간 등\n분위기까지 고려해요.",
  },
];

function MainPage() {
  const { token, login } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [featureRef, featureInView] = useInView<HTMLDivElement>();
  const [aiMatchRef, aiMatchInView] = useInView<HTMLDivElement>();
  const [stepsRef, stepsInView] = useInView<HTMLDivElement>();
  const { isRedirecting, goToMatching } = useMatchingRedirect();

  const handleMatchClick = () => {
    if (!token) {
      setIsLoginOpen(true);
      return;
    }
    goToMatching(token);
  };

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-particles" aria-hidden="true">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="hero-particle" />
          ))}
        </div>
        <img className="mainpage-logo" src={logo} alt="Roomie" />
        <h1 className="logo">Roomie</h1>
        <h1 className="hero-tagline">
          지금 당장 나와 어울리는 <span className="hero-tagline-highlight">룸메이트</span>를 찾아보세요
        </h1>
        <button type="button" className="btn btn-primary hero-cta" onClick={handleMatchClick}>
          무료로 시작하기
        </button>
      </section>

      <section className="why-section">
        <h2>왜 <span className="roomie-brand">Roomie</span>인가요?</h2>
        <p className="why-subtitle">생활 패턴부터 가치관까지, 중요한 것들을 함께 고려해요.</p>
        <div
          ref={featureRef}
          className={`feature-grid${featureInView ? " in-view" : ""}`}
        >
          {features.map((feature) => (
            <div key={feature.title} className="feature-card">
              <div className="feature-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">{feature.icon}</svg>
              </div>
              <h3>{feature.title}</h3>
              <p>
                {feature.body.split("\n").map((line, i) => (
                  <span key={i}>
                    {line}
                    <br />
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="ai-match-section">
        <div className="ai-match-content">
          <div className="ai-match-text">
            <h2>
              AI가 분석하는
              <br />
              <span className="ai-match-highlight">맞춤형 룸메이트 매칭</span>
            </h2>
            <p>
              <span className="roomie-brand">Roomie</span>의 AI는 생활습관, 성격, 가치관, 선호도를 종합 분석하여
              당신과 가장 잘 맞는 룸메이트를 추천합니다.
            </p>
          </div>

          <div
            ref={aiMatchRef}
            className={`ai-match-card${aiMatchInView ? " in-view" : ""}`}
          >
            <div className="ai-match-grid">
              <div className="ai-match-panel ai-match-panel-compare">
                <div className="ai-match-panel-header">
                  <p className="ai-match-panel-title">지민님과의 궁합</p>
                  <div
                    className="ai-match-gauge"
                    style={{ "--gauge-percent": `${overallMatch}%` } as CSSProperties}
                  >
                    <div className="ai-match-gauge-ring">
                      <div className="ai-match-gauge-center">
                        <div className="ai-match-gauge-score">
                          <span className="ai-match-gauge-score-value">{overallMatch}</span>
                          <span className="ai-match-gauge-score-unit">점</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ai-match-points-grid">
                  <div>
                    <p className="ai-match-points-label">맞는 포인트</p>
                    <div className="ai-match-points-list">
                      {matchingPoints.map((label) => (
                        <span key={label} className="ai-match-point-chip">
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="ai-match-points-label">다른 포인트</p>
                    <div className="ai-match-points-list">
                      {differingPoints.map((label) => (
                        <span key={label} className="ai-match-point-chip ai-match-point-chip-diff">
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="ai-match-panel ai-match-panel-profile">
                <img className="ai-match-profile-avatar" src={sampleAvatar} alt={sampleProfile.name} />
                <p className="ai-match-profile-name">{sampleProfile.name}</p>
                <p className="ai-match-profile-meta">{sampleProfile.meta}</p>
                <p className="ai-match-profile-bio">{sampleProfile.bio}</p>
                <div className="ai-match-profile-tags">
                  {sampleProfile.tags.map((tag) => (
                    <span key={tag} className="ai-match-profile-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="ai-match-ai-explanation">
              <p className="ai-match-ai-label">AI 궁합 설명</p>
              <p className="ai-match-ai-text">{sampleAiExplanation}</p>
            </div>
     
          </div>
        </div>
      </section>

      <section className="steps-section">
        <h2><span className="roomie-brand">Roomie</span> 이용 방법</h2>
        <div
          ref={stepsRef}
          className={`steps-row${stepsInView ? " in-view" : ""}`}
        >
          {steps.map((step, i) => (
            <div key={step.title} className="step-item-wrap">
              <div className="step-item">
                <div className="step-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">{step.icon}</svg>
                </div>
                <h3>{step.title}</h3>
                <p>
                  {step.body.split("\n").map((line, j) => (
                    <span key={j}>
                      {line}
                      <br />
                    </span>
                  ))}
                </p>
              </div>
              {i < steps.length - 1 && (
                <span className="step-arrow" aria-hidden="true">
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {isLoginOpen && (
        <LoginModal
          onClose={() => setIsLoginOpen(false)}
          onLoginSuccess={(authToken) => {
            login(authToken);
            setIsLoginOpen(false);
            goToMatching(authToken);
          }}
        />
      )}

      <button
        type="button"
        className="scroll-top-btn"
        aria-label="맨 위로"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>

      {isRedirecting && <MatchingLoadingOverlay />}
    </div>
  );
}

export default MainPage;
