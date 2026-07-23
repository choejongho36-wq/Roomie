import "./MyPageContent.css";

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="mypage-panel">
      <h1 className="mypage-panel-title">{title}</h1>
      <div className="mypage-empty">
        <p>준비 중인 기능이에요.</p>
      </div>
    </div>
  );
}

export default PlaceholderPage;
