import "./MatchingLoadingOverlay.css";

function MatchingLoadingOverlay() {
  return (
    <div className="matching-loading-overlay">
      <div className="matching-loading-dots">
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className="matching-loading-dot" style={{ "--i": i } as React.CSSProperties} />
        ))}
      </div>
      <p>
        당신과 꼭 맞는 <span className="matching-loading-highlight">룸메이트</span>를 찾고 있어요...
      </p>
    </div>
  );
}

export default MatchingLoadingOverlay;
