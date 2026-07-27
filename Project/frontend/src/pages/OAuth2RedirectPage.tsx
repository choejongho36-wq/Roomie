import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./OAuth2RedirectPage.css";

// 카카오/네이버 로그인이 끝나면 백엔드가 이 주소로 리다이렉트시켜줌:
//   성공 시: /oauth2/redirect?token=...&needsAdditionalInfo=true|false
//   실패 시: /oauth2/redirect?error=메시지
function OAuth2RedirectPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const needsAdditionalInfo = searchParams.get("needsAdditionalInfo") === "true";
    const errorMessage = searchParams.get("error");

    if (errorMessage) {
      setError(errorMessage);
      return;
    }

    if (!token) {
      setError("로그인 처리 중 문제가 발생했습니다. 다시 시도해주세요.");
      return;
    }

    // AuthContext의 login()이 localStorage 저장 + 내 정보 조회까지 알아서 처리해줌
    // (일반 로그인 때와 완전히 동일한 방식이라 이후 로직은 소셜/일반 구분 없이 똑같이 동작)
    login(token);

    if (needsAdditionalInfo) {
      navigate("/complete-profile", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
    // 최초 마운트 시 URL 파라미터를 한 번만 처리하면 되므로 의도적으로 빈 의존성 배열 사용
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="oauth2-redirect-page">
        <p className="oauth2-redirect-message">{error}</p>
        <button className="btn btn-primary" onClick={() => navigate("/")}>
          홈으로 가기
        </button>
      </div>
    );
  }

  return (
    <div className="oauth2-redirect-page">
      <p className="oauth2-redirect-message">로그인 처리 중입니다...</p>
    </div>
  );
}

export default OAuth2RedirectPage;