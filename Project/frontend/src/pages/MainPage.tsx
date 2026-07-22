import "./MainPage.css";
import logo from "../assets/Roomie_logo2.png";

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

const infoSections = [
  {
    title: "서비스 소개",
    body: "Roomie가 어떤 서비스인지 소개하는 영역입니다.",
  },
  {
    title: "이용 방법",
    body: "매칭부터 모집글 작성까지 이용 흐름을 안내하는 영역입니다.",
  },
  {
    title: "자주 묻는 질문",
    body: "문의하기 전에 확인하면 좋은 내용을 모아두는 영역입니다.",
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

      {infoSections.map((section, i) => (
        <section
          key={section.title}
          className={`info-section ${i % 2 === 1 ? "info-section-alt" : ""}`}
        >
          <div className={`info-content ${i % 2 === 1 ? "reverse" : ""}`}>
            <div className="info-image" />
            <div className="info-text">
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

export default MainPage;
