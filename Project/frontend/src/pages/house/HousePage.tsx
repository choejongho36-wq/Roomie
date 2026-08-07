import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_ORIGIN, disbandHouse, getMatchedPair } from "../../api";
import type { MatchedPair } from "../../types/matchedPair";
import { HOUSE_MENU } from "./HouseSidebar";
import defaultAvatar from "../../assets/Roomie_logo.png";
import "../mypage/MyPageContent.css";
import "../MatchedPairPage.css";
import "./HousePage.css";

const getAvatarSrc = (url: string | null) => (url ? `${API_ORIGIN}${url}` : null);

function HousePage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [pair, setPair] = useState<MatchedPair | null>(null);
  const [isDisbanding, setIsDisbanding] = useState(false);
  const [showDisbandConfirm, setShowDisbandConfirm] = useState(false);

  useEffect(() => {
    if (!token || !id) return;
    getMatchedPair(token, Number(id)).then(setPair).catch(() => setPair(null));
  }, [token, id]);

  const handleDisband = async () => {
    if (!token || !id || !pair) return;
    setIsDisbanding(true);
    try {
      await disbandHouse(token, Number(id));
      navigate(`/mypage/chat?userId=${pair.partner.userId}`);
    } finally {
      setIsDisbanding(false);
      setShowDisbandConfirm(false);
    }
  };

  return (
    <div className="mypage-panel">
      <h1 className="mypage-panel-title">하우스</h1>
      <p className="mypage-panel-desc">함께 사는 공간을 관리해보세요.</p>

      {pair && (
        <div className="profile-card profile-card-vertical house-home-card">
          <div className="matched-pair-avatars">
            {[pair.me, pair.partner].map((person) => (
              <div key={person.userId} className="matched-pair-avatar-item">
                <img src={getAvatarSrc(person.profileImageUrl) ?? defaultAvatar} alt="" />
                <span>{person.nickname}</span>
              </div>
            ))}
          </div>
          <h2>{pair.me.nickname}님과 {pair.partner.nickname}님의 하우스</h2>
          <p className="profile-card-meta">{pair.region ?? "지역 정보 없음"}</p>
        </div>
      )}

      <div className="house-menu">
        {HOUSE_MENU.map((item) => (
          <Link key={item.path} to={`/house/${id}/${item.path}`} className="house-menu-card">
            <strong>{item.label}</strong>
            <span>{item.description}</span>
          </Link>
        ))}
      </div>

      {pair && (
        <button type="button" className="house-disband-button" onClick={() => setShowDisbandConfirm(true)}>
          하우스 해산
        </button>
      )}

      {showDisbandConfirm && pair && (
        <div className="info-modal-backdrop" onClick={() => setShowDisbandConfirm(false)}>
          <div className="info-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <p>
              {pair.partner.nickname}님과의 룸메이트 생활을 마무리할까요?
              <br />
              하우스를 해산하면 두 분 모두 다시 접근할 수 없고, 채팅방에서 작별인사를 나눌 수 있어요.
            </p>
            <div className="info-modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setShowDisbandConfirm(false)}>
                취소
              </button>
              <button type="button" className="btn btn-primary" onClick={handleDisband} disabled={isDisbanding}>
                {isDisbanding ? "처리 중..." : "해산하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HousePage;
