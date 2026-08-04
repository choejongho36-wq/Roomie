import { NavLink, useParams } from "react-router-dom";
import { Icon } from "../../components/mypage/MyPageSidebar";
import "../../components/mypage/MyPageSidebar.css";

// 사이드바와 하우스 홈의 메뉴 카드가 같은 목록을 쓰도록 여기서 한 번만 정의한다.
export const HOUSE_MENU = [
  { path: "bills", label: "관리비 정산", icon: "sliders", description: "함께 낸 관리비를 정산해요." },
  { path: "cleaning", label: "청소당번", icon: "gear", description: "누가 어디를, 언제 치울지 나눠요." },
];

// 마이페이지 사이드바(components/mypage/MyPageSidebar)와 완전히 같은 클래스를 써서
// 갖다 대면 펼쳐지는 동작과 크기를 그대로 맞춘다.
function HouseSidebar() {
  const { id } = useParams<{ id: string }>();

  const navItems = [
    { to: `/house/${id}`, label: "하우스 홈", icon: "home", end: true },
    ...HOUSE_MENU.map((item) => ({ ...item, to: `/house/${id}/${item.path}`, end: false })),
  ];

  return (
    <aside className="mypage-sidebar">
      <nav className="mypage-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `mypage-nav-item${isActive ? " mypage-nav-item-active" : ""}`
            }
          >
            <Icon name={item.icon} />
            <span className="mypage-nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default HouseSidebar;
