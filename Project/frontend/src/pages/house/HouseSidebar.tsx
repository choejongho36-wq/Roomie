import { NavLink, useParams } from "react-router-dom";
import { Icon } from "../../components/mypage/MyPageSidebar";
import "../../components/mypage/MyPageSidebar.css";

// 마이페이지 사이드바(components/mypage/MyPageSidebar)와 완전히 같은 클래스를 써서
// 갖다 대면 펼쳐지는 동작과 크기를 그대로 맞춘다.
function HouseSidebar() {
  const { id } = useParams<{ id: string }>();

  const navItems = [
    { to: `/house/${id}`, label: "하우스 홈", icon: "home", end: true },
    { to: `/house/${id}/bills`, label: "관리비 정산", icon: "sliders", end: false },
    { to: `/house/${id}/chores`, label: "청소당번", icon: "clock", end: false },
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
