import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MyPageSidebar from "../components/mypage/MyPageSidebar";
import "./MyPage.css";

function MyPage() {
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    if (!token) navigate("/");
  }, [token, navigate]);

  return (
    <div className="mypage">
      <MyPageSidebar />
      <main className="mypage-content">
        <Outlet />
      </main>
    </div>
  );
}

export default MyPage;
