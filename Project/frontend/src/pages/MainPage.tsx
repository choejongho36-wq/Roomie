import "./MainPage.css";

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

function MainPage() {
  return (
    <div className="page">
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
      <h1 className="logo">Roomie</h1>
      <div className="auth-box">
        <p>Roomie가 처음이신가요?</p>
        <div className="auth-actions">
          <button className="btn btn-outline">로그인</button>
          <button className="btn btn-primary">회원가입</button>
        </div>
      </div>
    </div>
  );
}

export default MainPage;
