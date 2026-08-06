import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import HouseSidebar from "./HouseSidebar";
import "../mypage/MyPageLayout.css";
import "./HouseLayout.css";

// 마이페이지와 동일한 레이아웃(양식)을 그대로 재사용한다: 왼쪽에 갖다 대면
// 펼쳐지는 아이콘 사이드바 + 오른쪽 컨텐츠 영역.
function HouseLayout() {
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    if (!token) navigate("/");
  }, [token, navigate]);

  return (
    <div className="mypage house-mypage">
      <HouseSidebar />
      <main className="mypage-content">
        <Outlet />
      </main>
    </div>
  );
}

export default HouseLayout;
