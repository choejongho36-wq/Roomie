import "./MatchingLoadingOverlay.css";

function MatchingLoadingOverlay() {
  return (
    <div className="matching-loading-overlay">
      <div className="matching-loading-stack">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="matching-loading-card" style={{ "--i": i } as React.CSSProperties}>
            <span className="matching-loading-card-avatar" />
            <span className="matching-loading-card-lines">
              <span className="matching-loading-card-line matching-loading-card-line-short" />
              <span className="matching-loading-card-line matching-loading-card-line-long" />
            </span>
          </div>
        ))}
      </div>
      <p>
        당신과 꼭 맞는 <span className="matching-loading-highlight">룸메이트</span>를 찾고 있어요...
      </p>
    </div>
  );
}

export default MatchingLoadingOverlay;
