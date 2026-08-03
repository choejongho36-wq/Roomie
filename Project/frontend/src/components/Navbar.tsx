import { useState, type MouseEvent } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import type { NotificationItem } from "../types/chat";
import { API_ORIGIN } from "../api";
import "./Navbar.css";
import LoginModal from "./LoginModal";
import MatchingLoadingOverlay from "./MatchingLoadingOverlay";
import logo from "../assets/Roomie_logo.png";
import logoWhite from "../assets/Roomie_logo2.png";
import { Icon, NAV_ITEMS } from "./mypage/MyPageSidebar";
import { useMatchingRedirect } from "../hooks/useMatchingRedirect";

const PROFILE_MENU_ITEMS = NAV_ITEMS.filter((item) => item.icon !== "bell");

// 배경 자체가 진한 오렌지 그라데이션인 페이지 — 네비바는 연한 필로 반전해서 대비를 준다.
const VIVID_BACKGROUND_PATHS = new Set(["/", "/signup"]);

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user, login, logout } = useAuth();
  const { notifications, unreadCount, removeNotification, clearAllNotifications, chatUnreadCount } = useChat();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [redirectAfterLogin, setRedirectAfterLogin] = useState(false);
  const { isRedirecting, goToMatching } = useMatchingRedirect();

  const isOnVividBackground = VIVID_BACKGROUND_PATHS.has(location.pathname);

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
    <header className={`navbar${isOnVividBackground ? " navbar-light" : ""}`}>
      <div className="navbar-shell">
        <Link to="/" className="navbar-logo">
          <img src={isOnVividBackground ? logo : logoWhite} alt="Roomie" />
        </Link>
        <nav className="navbar-menu">
          <button type="button" className="navbar-menu-link" onClick={handleMatchClick}>
            매칭
          </button>
          <Link to="/house" className="navbar-menu-link">
            하우스
          </Link>
          <div className="navbar-dropdown">
            <span className="navbar-menu-link navbar-dropdown-trigger">커뮤니티</span>
            <div className="navbar-dropdown-menu">
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
            <span className="navbar-menu-link navbar-dropdown-trigger">고객센터</span>
            <div className="navbar-dropdown-menu">
              <Link to="/inquiry" className="navbar-dropdown-item">
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
            <div className="navbar-dropdown">
              <button type="button" className="navbar-notify-btn" aria-label="알림">
                <Icon name="bell" />
                {unreadCount > 0 && <span className="navbar-notify-dot" />}
              </button>
              <div className="navbar-dropdown-menu navbar-notify-menu">
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
              <span className="navbar-profile-trigger">
                <img
                  className="navbar-profile-btn"
                  src={user?.profileImageUrl ? `${API_ORIGIN}${user.profileImageUrl}` : logo}
                  alt=""
                />
                <span className="navbar-profile-nickname">{user?.nickname}</span>
              </span>
              <div className="navbar-dropdown-menu navbar-profile-dropdown-menu">
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
      {isLoginOpen && (
        <LoginModal
          onClose={() => {
            setIsLoginOpen(false);
            setRedirectAfterLogin(false);
          }}
          onLoginSuccess={(token) => {
            login(token);
            setIsLoginOpen(false);
            if (redirectAfterLogin) {
              setRedirectAfterLogin(false);
              goToMatching(token);
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