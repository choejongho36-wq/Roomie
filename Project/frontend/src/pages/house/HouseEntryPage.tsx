import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMyConfirmedHouse } from "../../api";
import { useMatchingRedirect } from "../../hooks/useMatchingRedirect";
import MatchingLoadingOverlay from "../../components/MatchingLoadingOverlay";
import "./HousePage.css";

// 네비바 "하우스" 클릭 시 들어오는 진입점. 내 확정된 하우스를 찾아서 바로 이동시키고,
// 아직 확정된 매칭이 없으면 안내 메시지를 보여준다.
function HouseEntryPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [notConfirmed, setNotConfirmed] = useState(false);
  const { isRedirecting, goToMatching } = useMatchingRedirect();

  useEffect(() => {
    if (!token) return;
    getMyConfirmedHouse(token)
      .then((house) => navigate(`/house/${house.id}`, { replace: true }))
      .catch(() => setNotConfirmed(true));
  }, [token, navigate]);

  if (!token) {
    return (
      <div className="house-page">
        <p>로그인이 필요합니다.</p>
      </div>
    );
  }

  if (notConfirmed) {
    return (
      <div className="house-page">
        <h1>아직 확정된 하우스가 없어요</h1>
        <p>룸메이트와 매칭을 확정하면 하우스 공간을 이용할 수 있어요.</p>
        <button type="button" className="house-entry-cta" onClick={() => token && goToMatching(token)}>
          매칭 하러 가기
        </button>
        {isRedirecting && <MatchingLoadingOverlay />}
      </div>
    );
  }

  return (
    <div className="house-page">
      <p>불러오는 중...</p>
    </div>
  );
}

export default HouseEntryPage;
