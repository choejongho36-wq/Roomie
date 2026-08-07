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
  // 하우스 "관리비 정산" 메뉴용 — 돈/정산을 나타내는 달러 기호 아이콘
  dollar: (
    <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
  ),
  // 하우스 "청소당번" 메뉴용 — 청소를 나타내는 양동이 아이콘
  bucket: (
    <>
      <path d="M5 8h14l-1.6 11.2A2 2 0 0115.4 21H8.6a2 2 0 01-2-1.8L5 8z" />
      <path d="M8 8a4 4 0 018 0" />
    </>
  ),
  // 하우스 "하우스 규칙" 메뉴용 — 문서(약관/규칙) 아이콘
  document: (
    <>
      <path d="M6 3h9l3 3v15a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" />
      <path d="M14 3v4h4" />
      <path d="M8 12h8M8 16h8" />
    </>
  ),
  // 하우스 "룸메 계약서" 메뉴용 — 서명/확인된 문서 아이콘
  contract: (
    <>
      <path d="M6 3h9l3 3v15a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" />
      <path d="M14 3v4h4" />
      <path d="M8.5 13.5l2 2 4-4" />
    </>
  ),
  // 하우스 "생필품 장바구니" 메뉴용 — 장바구니 아이콘
  cart: (
    <>
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
      <path d="M2 3h2l2.6 12.4a2 2 0 002 1.6h8.8a2 2 0 002-1.6L21 7H6" />
    </>
  ),
  // 하우스 "하우스 앨범" 메뉴용 — 사진 아이콘
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="M21 16l-5-5-4 4-3-3-4 4" />
    </>
  ),
  home: (
    <>
      <path d="M4 11l8-7 8 7" />
      <path d="M6 10v9a1 1 0 001 1h4v-6h2v6h4a1 1 0 001-1v-9" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" strokeLinecap="round" />,
  // 고객센터(문의 게시판) 메뉴용 — 물음표 아이콘
  support: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 015 .5c0 1.7-2.5 1.7-2.5 3.5" strokeLinecap="round" />
      <path d="M12 17h.01" strokeLinecap="round" />
    </>
  ),
  smile: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 10h.01M15.5 10h.01" strokeLinecap="round" />
      <path d="M8 14c1 1.6 2.5 2.5 4 2.5s3-.9 4-2.5" />
    </>
  ),
};

export function Icon({ name }: { name: string }) {
  return (
    <svg className="mypage-nav-icon" viewBox="0 0 24 24">
      {ICONS[name]}
    </svg>
  );
}

export const NAV_ITEMS = [
  { to: "/mypage", label: "내 프로필", icon: "person", end: true },
  { to: "/mypage/my-activity", label: "내 활동", icon: "sliders" },
  { to: "/mypage/interests", label: "관심 목록", icon: "heart" },
  { to: "/mypage/chat", label: "채팅", icon: "chat" },
  { to: "/mypage/activity", label: "설문 기록", icon: "clock" },
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
            <span className="mypage-nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <button className="mypage-nav-item mypage-nav-item-logout" onClick={handleLogout}>
        <Icon name="logout" />
        <span className="mypage-nav-label">로그아웃</span>
      </button>
    </aside>
  );
}

export default MyPageSidebar;
