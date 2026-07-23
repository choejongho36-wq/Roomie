import { Link } from "react-router-dom";
import "./MainPage.css";
import logo from "../assets/Roomie_logo2.png";

const matchStats = [
  { label: "생활 패턴", percent: 95 },
  { label: "청결도", percent: 90 },
  { label: "성격 유형", percent: 88 },
  { label: "가치관", percent: 87 },
  { label: "취미", percent: 85 },
];

const overallMatch = 92;
const ringCircumference = 2 * Math.PI * 40;

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

const bubbles = [
  { left: "5%", size: 24, duration: 14, delay: 0 },
  { left: "15%", size: 12, duration: 10, delay: 2 },
  { left: "28%", size: 32, duration: 18, delay: 1 },
  { left: "40%", size: 16, duration: 12, delay: 4 },
  { left: "55%", size: 20, duration: 16, delay: 0.5 },
  { left: "67%", size: 10, duration: 9, delay: 3 },
  { left: "78%", size: 28, duration: 15, delay: 2.5 },
  { left: "88%", size: 14, duration: 11, delay: 1.5 },
];

const features = [
  {
    icon: (
      <path d="M4 13a8 8 0 1 0 8-8 6 6 0 0 0 0 8 8 8 0 0 1-8 0z" />
    ),
    title: "생활 패턴 매칭",
    body: "수면 시간, 기상 시간 등\n일상 패턴을 분석해요.",
  },
  {
    icon: (
      <>
        <path d="M6 20l6-14M12 6l4 4" />
        <path d="M9 20h10" />
      </>
    ),
    title: "청결도 & 공간관리",
    body: "청결도 기준과 정리 습관까지\n세심하게 맞춰드려요.",
  },
  {
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 8l8 8M16 8l-8 8" />
      </>
    ),
    title: "흡연·음주 성향",
    body: "흡연 여부, 음주 빈도까지\n솔직하게 설정할 수 있어요.",
  },
  {
    icon: (
      <>
        <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
        <rect x="2" y="14" width="5" height="6" rx="2" />
        <rect x="17" y="14" width="5" height="6" rx="2" />
      </>
    ),
    title: "선호하는 분위기",
    body: "조용한 환경, 함께하는 시간 등\n분위기까지 고려해요.",
  },
];

function MainPage() {
  return (
    <div className="page">
      <section className="hero">
        <div className="bubbles" aria-hidden="true">
          {bubbles.map((b, i) => (
            <span
              key={i}
              className="bubble"
              style={{
                left: b.left,
                width: b.size,
                height: b.size,
                animationDuration: `${b.duration}s`,
                animationDelay: `${b.delay}s`,
              }}
            />
          ))}
        </div>
        <img className="mainpage-logo" src={logo} alt="Roomie" />
        <h1 className="logo">Roomie</h1>
      </section>

      <section className="why-section">
        <h2>왜 Roomie인가요?</h2>
        <p className="why-subtitle">생활 패턴부터 가치관까지, 중요한 것들을 함께 고려해요.</p>
        <div className="feature-grid">
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
              Roomie의 AI는 생활습관, 성격, 가치관, 선호도를 종합 분석하여
              당신과 가장 잘 맞는 룸메이트를 추천합니다.
            </p>
            <Link to="/survey" className="btn btn-primary">
              AI 매칭 시작
            </Link>
          </div>

          <div className="ai-match-card">
            <h3>매칭 분석 결과</h3>
            <div className="ai-match-body">
              <div className="ai-match-bars">
                {matchStats.map((stat) => (
                  <div key={stat.label} className="ai-match-bar-row">
                    <span className="ai-match-bar-label">{stat.label}</span>
                    <div className="ai-match-bar-track">
                      <div
                        className="ai-match-bar-fill"
                        style={{ width: `${stat.percent}%` }}
                      />
                    </div>
                    <span className="ai-match-bar-percent">{stat.percent}%</span>
                  </div>
                ))}
              </div>

              <div className="ai-match-ring">
                <svg viewBox="0 0 100 100">
                  <circle className="ai-match-ring-track" cx="50" cy="50" r="40" />
                  <circle
                    className="ai-match-ring-fill"
                    cx="50"
                    cy="50"
                    r="40"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={
                      ringCircumference - (overallMatch / 100) * ringCircumference
                    }
                  />
                </svg>
                <div className="ai-match-ring-label">
                  <span className="ai-match-ring-title">종합 매칭률</span>
                  <span className="ai-match-ring-percent">{overallMatch}%</span>
                </div>
              </div>
            </div>
            <span className="ai-match-badge">매우 높음</span>
            <p className="ai-match-note">★ 당신과 정말 잘 맞는 룸메이트예요!</p>
          </div>
        </div>
      </section>

      <section className="steps-section">
        <h2>Roomie 이용 방법</h2>
        <div className="steps-row">
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
    </div>
  );
}

export default MainPage;
