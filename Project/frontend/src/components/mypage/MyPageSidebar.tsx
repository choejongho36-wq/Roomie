import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./MyPageSidebar.css";

const ICONS: Record<string, ReactNode> = {
  person: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 6h8M16 6h4M4 12h2M10 12h10M4 18h12M20 18h0" />
      <circle cx="12" cy="6" r="2" />
      <circle cx="6" cy="12" r="2" />
      <circle cx="16" cy="18" r="2" />
    </>
  ),
  heart: (
    <path d="M12 20s-6.5-4-8.6-7.8C1.8 9.4 3 6 6.3 5.5c2-.3 3.8.9 5.7 3 1.9-2.1 3.7-3.3 5.7-3 3.3.5 4.5 3.9 2.9 6.7C18.5 16 12 20 12 20z" />
  ),
  chat: <path d="M4 5h16v11H8l-4 4z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </>
  ),
  bell: (
    <path d="M6 9a6 6 0 1112 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9zM10 19a2 2 0 004 0" />
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13.5a7.4 7.4 0 000-3l1.9-1.5-2-3.4-2.3.9a7.3 7.3 0 00-2.6-1.5L14 2.6h-4l-.4 2.4a7.3 7.3 0 00-2.6 1.5l-2.3-.9-2 3.4L4.6 10.5a7.4 7.4 0 000 3L2.7 15l2 3.4 2.3-.9c.8.6 1.7 1.2 2.6 1.5l.4 2.4h4l.4-2.4a7.3 7.3 0 002.6-1.5l2.3.9 2-3.4z" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </>
  ),
};

function Icon({ name }: { name: string }) {
  return (
    <svg className="mypage-nav-icon" viewBox="0 0 24 24">
      {ICONS[name]}
    </svg>
  );
}

const NAV_ITEMS = [
  { to: "/mypage", label: "내 프로필", icon: "person", end: true },
  { to: "/mypage/my-activity", label: "내 활동", icon: "sliders" },
  { to: "/mypage/interests", label: "관심 목록", icon: "heart" },
  { to: "/mypage/chat", label: "채팅", icon: "chat" },
  { to: "/mypage/activity", label: "설문 기록", icon: "clock" },
  { to: "/mypage/notifications", label: "알림", icon: "bell" },
  { to: "/mypage/settings", label: "계정 설정", icon: "gear" },
];

function MyPageSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <aside className="mypage-sidebar">
      <h2 className="mypage-sidebar-title">마이페이지</h2>
      <nav className="mypage-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `mypage-nav-item${isActive ? " mypage-nav-item-active" : ""}`
            }
          >
            <Icon name={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <button className="mypage-nav-item mypage-nav-item-logout" onClick={handleLogout}>
        <Icon name="logout" />
        로그아웃
      </button>
    </aside>
  );
}

export default MyPageSidebar;
