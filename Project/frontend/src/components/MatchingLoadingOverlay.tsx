import { createPortal } from "react-dom";
import "./MatchingLoadingOverlay.css";

function MatchingLoadingOverlay() {
  // Navbar 안에서 렌더링되는 경우가 있는데, Navbar가 position:relative + z-index:10으로
  // 자체 stacking context를 만들어버려서 이 오버레이의 z-index:200이 그 안에서만 유효해진다.
  // 그 결과 마이페이지 사이드바(z-index:10)처럼 바깥의 다른 요소가 이 오버레이를 덮어버릴 수
  // 있었다(실제로 마이페이지 → 매칭 로딩 시 사이드바가 위로 보이는 버그였음). position:fixed
  // 전체화면 오버레이는 어차피 어디서 마운트되든 화면 전체를 덮으므로, document.body에 바로
  // 포탈로 그려서 부모의 stacking context 영향을 받지 않게 한다.
  return createPortal(
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
    </div>,
    document.body
  );
}

export default MatchingLoadingOverlay;
