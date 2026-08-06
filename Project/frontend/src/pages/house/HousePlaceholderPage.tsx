import "../mypage/MyPageContent.css";

// 하우스 메뉴 중 아직 실제 기능이 없는 것들("추후 업데이트")이 공통으로 쓰는 껍데기.
// 제목/부제목만 다르고 나머지 구조는 똑같아서 페이지마다 따로 만들지 않고 이걸 재사용한다.
function HousePlaceholderPage({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mypage-panel">
      <h1 className="mypage-panel-title">{title}</h1>
      <p className="mypage-panel-desc">{desc}</p>

      <div className="mypage-empty">
        <p>추후 업데이트 될 설정입니다.</p>
      </div>
    </div>
  );
}

export default HousePlaceholderPage;
