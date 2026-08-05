import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import type { NotificationItem } from "../types/chat";
import { API_ORIGIN, getMyConfirmedHouse } from "../api";
import "./Navbar.css";
import LoginModal from "./LoginModal";
import MatchingLoadingOverlay from "./MatchingLoadingOverlay";
import logo from "../assets/Roomie_logo.png";
import logoWhite from "../assets/Roomie_logo2.png";
import { Icon, NAV_ITEMS } from "./mypage/MyPageSidebar";
import { useMatchingRedirect } from "../hooks/useMatchingRedirect";

const PROFILE_MENU_ITEMS = NAV_ITEMS.filter((item) => item.icon !== "bell");

// 배경 자체가 진한 오렌지 그라데이션인 페이지 — 네비바는 연한 필로 반전해서 대비를 준다.
const VIVID_BACKGROUND_PATHS = new Set(["/", "/signup", "/complete-profile"]);

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user, login, logout } = useAuth();
  const { notifications, unreadCount, removeNotification, clearAllNotifications, chatUnreadCount } = useChat();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [redirectAfterLogin, setRedirectAfterLogin] = useState(false);
  const [pendingNavPath, setPendingNavPath] = useState<string | null>(null);
  const { isRedirecting, goToMatching } = useMatchingRedirect();
  const [houseId, setHouseId] = useState<number | null>(null);
  // 드롭다운은 hover 대신 클릭/탭으로 열고 닫는다 — 터치 기기에는 hover가 없어서
  // 데스크톱에서만 동작하던 기존 방식은 모바일에서 아예 열리지 않았음
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const shellRef = useRef<HTMLDivElement | null>(null);

  const isOnVividBackground = VIVID_BACKGROUND_PATHS.has(location.pathname);
  const toggleMenu = (key: string) => setOpenMenu((prev) => (prev === key ? null : key));

  // api.ts 인터셉터가 401(세션 만료)을 감지하면, 홈으로 보내고 로그인 모달을 자동으로 띄움
  useEffect(() => {
    const handleSessionExpired = () => {
      navigate("/");
      setIsLoginOpen(true);
    };
    window.addEventListener("session-expired", handleSessionExpired);
    return () => window.removeEventListener("session-expired", handleSessionExpired);
  }, [navigate]);

  // 드롭다운/모바일 메뉴 바깥을 클릭하면 닫음 (RegionPicker와 동일한 패턴)
  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (shellRef.current && !shellRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 페이지 이동 시 열려있던 메뉴는 자동으로 닫음
  useEffect(() => {
    setOpenMenu(null);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // 하우스 드롭다운(관리비정산/청소당번)은 매칭이 확정돼 실제 하우스가 있는 사람에게만 보여준다.
  useEffect(() => {
    if (!token) {
      setHouseId(null);
      return;
    }
    getMyConfirmedHouse(token)
      .then((house) => setHouseId(house.id))
      .catch(() => setHouseId(null));
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleMatchClick = () => {
    if (!token) {
      setRedirectAfterLogin(true);
      setIsLoginOpen(true);
      return;
    }

    goToMatching(token);
  };

  // 비회원 전용 안내 페이지(하우스 진입, 문의 게시판)로 보내는 대신, 로그인 모달을 바로 띄운다.
  const handleGatedLinkClick = (e: MouseEvent, path: string) => {
    if (token) return;
    e.preventDefault();
    setPendingNavPath(path);
    setIsLoginOpen(true);
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    removeNotification(notification.notificationId);
    if (notification.type === "COMMENT_REPLY" && notification.targetId) {
      navigate(`/board/${notification.targetId}`);
    } else {
      navigate(`/mypage/chat?userId=${notification.senderId}`);
    }
  };

  const handleDeleteNotification = (e: MouseEvent, notificationId: number) => {
    e.stopPropagation();
    removeNotification(notificationId);
  };

  return (
    <header
      className={`navbar${isOnVividBackground ? " navbar-light" : ""}${mobileMenuOpen ? " is-mobile-open" : ""}`}
    >
      <div className="navbar-shell" ref={shellRef}>
        <Link to="/" className="navbar-logo">
          <img src={isOnVividBackground ? logo : logoWhite} alt="Roomie" />
        </Link>
        <button
          type="button"
          className="navbar-hamburger"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="메뉴"
          aria-expanded={mobileMenuOpen}
        >
          <svg viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
        {/* 모바일에서 햄버거로 펼쳐지는 부분을 하나로 묶음 — 데스크톱에서는
            display:contents로 무시돼서 기존처럼 grid의 직접 자식으로 배치된다 */}
        <div className="navbar-mobile-panel">
        <nav className="navbar-menu">
          <button type="button" className="navbar-menu-link" onClick={handleMatchClick}>
            매칭
          </button>
          {houseId !== null ? (
            <div className="navbar-dropdown">
              <button
                type="button"
                className={`navbar-menu-link navbar-dropdown-trigger${openMenu === "house" ? " is-open" : ""}`}
                onClick={() => toggleMenu("house")}
                aria-expanded={openMenu === "house"}
              >
                하우스
              </button>
              <div className={`navbar-dropdown-menu${openMenu === "house" ? " is-open" : ""}`}>
                <Link to={`/house/${houseId}`} className="navbar-dropdown-item">
                  하우스 홈
                </Link>
                <Link to={`/house/${houseId}/bills`} className="navbar-dropdown-item">
                  관리비정산
                </Link>
                <Link to={`/house/${houseId}/cleaning`} className="navbar-dropdown-item">
                  청소당번
                </Link>
              </div>
            </div>
          ) : (
            <Link to="/house" className="navbar-menu-link" onClick={(e) => handleGatedLinkClick(e, "/house")}>
              하우스
            </Link>
          )}
          <div className="navbar-dropdown">
            <button
              type="button"
              className={`navbar-menu-link navbar-dropdown-trigger${openMenu === "community" ? " is-open" : ""}`}
              onClick={() => toggleMenu("community")}
              aria-expanded={openMenu === "community"}
            >
              커뮤니티
            </button>
            <div className={`navbar-dropdown-menu${openMenu === "community" ? " is-open" : ""}`}>
              <Link to="/board?type=공지사항" className="navbar-dropdown-item">
                공지사항
              </Link>
              <Link to="/board?type=이벤트" className="navbar-dropdown-item">
                이벤트
              </Link>
              <Link to="/board?type=자유 게시판" className="navbar-dropdown-item">
                자유 게시판
              </Link>
            </div>
          </div>
          <div className="navbar-dropdown">
            <button
              type="button"
              className={`navbar-menu-link navbar-dropdown-trigger${openMenu === "support" ? " is-open" : ""}`}
              onClick={() => toggleMenu("support")}
              aria-expanded={openMenu === "support"}
            >
              고객센터
            </button>
            <div className={`navbar-dropdown-menu${openMenu === "support" ? " is-open" : ""}`}>
              <Link to="/inquiry" className="navbar-dropdown-item" onClick={(e) => handleGatedLinkClick(e, "/inquiry")}>
                문의 게시판
              </Link>
              <Link to="/terms" className="navbar-dropdown-item">
                이용약관
              </Link>
              <Link to="/privacy" className="navbar-dropdown-item">
                개인정보처리방침
              </Link>
            </div>
          </div>
        </nav>
        <div className="navbar-auth">
          {token ? (
            <div className="navbar-dropdown navbar-notify-dropdown">
              <button
                type="button"
                className="navbar-notify-btn"
                aria-label="알림"
                onClick={() => toggleMenu("notify")}
                aria-expanded={openMenu === "notify"}
              >
                <Icon name="bell" />
                {unreadCount > 0 && <span className="navbar-notify-dot" />}
              </button>
              <div className={`navbar-dropdown-menu navbar-notify-menu${openMenu === "notify" ? " is-open" : ""}`}>
                {notifications.length === 0 ? (
                  <p className="navbar-notify-empty">알림이 없어요.</p>
                ) : (
                  <>
                    <div className="navbar-notify-header">
                      <button type="button" className="navbar-notify-clear-all" onClick={clearAllNotifications}>
                        모두 지우기
                      </button>
                    </div>
                    {notifications.map((notification) => (
                      <div key={notification.notificationId} className="navbar-notify-row">
                        <button
                          type="button"
                          className={`navbar-notify-item${notification.read ? "" : " navbar-notify-item-unread"}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <span className="navbar-notify-item-title">{notification.senderNickname}</span>
                          <span className="navbar-notify-item-content">
                            {notification.type === "CHAT"
                              ? `${notification.senderNickname}님이 메시지를 보냈습니다.`
                              : notification.content}
                          </span>
                        </button>
                        <button
                          type="button"
                          className="navbar-notify-delete"
                          aria-label="알림 삭제"
                          onClick={(e) => handleDeleteNotification(e, notification.notificationId)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          ) : null}
          {token ? (
            <div className="navbar-dropdown navbar-profile-dropdown">
              <button
                type="button"
                className="navbar-profile-trigger"
                onClick={() => toggleMenu("profile")}
                aria-expanded={openMenu === "profile"}
              >
                <img
                  className="navbar-profile-btn"
                  src={user?.profileImageUrl ? `${API_ORIGIN}${user.profileImageUrl}` : logo}
                  alt=""
                />
                <span className="navbar-profile-nickname">{user?.nickname}</span>
              </button>
              <div className={`navbar-dropdown-menu navbar-profile-dropdown-menu${openMenu === "profile" ? " is-open" : ""}`}>
                {PROFILE_MENU_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `navbar-profile-dropdown-item${isActive ? " navbar-profile-dropdown-item-active" : ""}`
                    }
                  >
                    <Icon name={item.icon} />
                    {item.label}
                    {item.to === "/mypage/chat" && chatUnreadCount > 0 && (
                      <span className="navbar-profile-chat-badge">
                        {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                      </span>
                    )}
                  </NavLink>
                ))}
                {user?.isAdmin && (
                  <a
                    href={`${API_ORIGIN}/admin/login`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="navbar-profile-dropdown-item"
                  >
                    <Icon name="gear" />
                    관리자 페이지
                  </a>
                )}
                <button
                  type="button"
                  className="navbar-profile-dropdown-item navbar-profile-dropdown-item-logout"
                  onClick={handleLogout}
                >
                  <Icon name="logout" />
                  로그아웃
                </button>
              </div>
            </div>
          ) : (
            <button className="navbar-auth-link" onClick={() => setIsLoginOpen(true)}>
              로그인
            </button>
          )}
        </div>
        </div>
      </div>
      {isLoginOpen && (
        <LoginModal
          onClose={() => {
            setIsLoginOpen(false);
            setRedirectAfterLogin(false);
            setPendingNavPath(null);
          }}
          onLoginSuccess={(token) => {
            login(token);
            setIsLoginOpen(false);
            if (redirectAfterLogin) {
              setRedirectAfterLogin(false);
              goToMatching(token);
            } else if (pendingNavPath) {
              const path = pendingNavPath;
              setPendingNavPath(null);
              navigate(path);
            } else {
              navigate("/");
            }
          }}
        />
      )}
      {isRedirecting && <MatchingLoadingOverlay />}
    </header>
  );
}

export default Navbar;