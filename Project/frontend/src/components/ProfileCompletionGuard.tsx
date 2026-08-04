import { useEffect, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// 소셜 로그인 신규가입 시 "추가정보 입력"을 다 마치기 전까지는,
// 다른 어떤 페이지로도(네비바 클릭이든 주소창 직접 입력이든) 못 나가게 강제로 되돌려보냄.
// 예외: /complete-profile 자체(그 페이지여야 하니까), /oauth2/redirect(로그인 직후 잠깐 거쳐가는 중간 경유지)
const ALLOWED_PATHS = new Set(["/complete-profile", "/oauth2/redirect"]);

function ProfileCompletionGuard({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.needsAdditionalInfo && !ALLOWED_PATHS.has(location.pathname)) {
      navigate("/complete-profile", { replace: true });
    }
  }, [user, location.pathname, navigate]);

  return <>{children}</>;
}

export default ProfileCompletionGuard;