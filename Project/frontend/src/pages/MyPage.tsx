import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyProfile } from "../api";
import type { User } from "../types";
import "./MyPage.css";

function MyPage() {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    getMyProfile(token)
      .then(setUser)
      .catch(() => setError("프로필을 불러오지 못했습니다."));
  }, [token, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="mypage">
      <div className="mypage-box">
        <div className="mypage-avatar" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
          </svg>
        </div>
        {error && <p className="mypage-error">{error}</p>}
        {user && (
          <>
            <h1>{user.nickname}</h1>
            <p>{user.email}</p>
            <button className="btn btn-outline" onClick={handleLogout}>
              로그아웃
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default MyPage;
