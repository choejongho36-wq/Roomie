import "./MatchingLoadingOverlay.css";

function MatchingLoadingOverlay() {
  return (
    <div className="matching-loading-overlay">
      <div className="matching-loading-spinner" />
      <p>
        당신과 꼭 맞는 <span className="matching-loading-highlight">룸메이트</span>를 찾고 있어요...
      </p>
    </div>
  );
}

export default MatchingLoadingOverlay;
