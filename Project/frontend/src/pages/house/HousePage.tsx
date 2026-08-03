import { Link, useParams } from "react-router-dom";
import "./HousePage.css";

// 정산/청소당번은 아직 실제 기능이 없어서 준비중 페이지로 연결됨 (PlaceholderPage 재사용)
const HOUSE_MENU_ITEMS = [
  { to: "bills", label: "관리비 정산", description: "함께 낸 관리비를 정산해요." },
  { to: "chores", label: "청소당번", description: "이번 주 청소 담당을 확인해요." },
];

function HousePage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="house-page">
      <h1>House</h1>
      <p>함께 사는 공간을 관리해보세요.</p>
      <div className="house-menu">
        {HOUSE_MENU_ITEMS.map((item) => (
          <Link key={item.to} to={`/house/${id}/${item.to}`} className="house-menu-card">
            <strong>{item.label}</strong>
            <span>{item.description}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default HousePage;
