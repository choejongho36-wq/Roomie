import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_ORIGIN, getMatchedPair } from "../../api";
import type { MatchedPair } from "../../types/matchedPair";
import "../mypage/MyPageContent.css";
import "../MatchedPairPage.css";
import "./HousePage.css";

const getAvatarSrc = (url: string | null) => (url ? `${API_ORIGIN}${url}` : null);

const HOUSE_MENU_ITEMS = [
  { to: "bills", label: "관리비 정산", description: "함께 낸 관리비를 정산해요." },
  { to: "chores", label: "청소당번", description: "이번 주 청소 담당을 확인해요." },
];

function HousePage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [pair, setPair] = useState<MatchedPair | null>(null);

  useEffect(() => {
    if (!token || !id) return;
    getMatchedPair(token, Number(id)).then(setPair).catch(() => setPair(null));
  }, [token, id]);

  return (
    <div className="mypage-panel">
      <h1 className="mypage-panel-title">하우스</h1>
      <p className="mypage-panel-desc">함께 사는 공간을 관리해보세요.</p>

      {pair && (
        <div className="profile-card profile-card-vertical house-home-card">
          <div className="matched-pair-avatars">
            {[pair.me, pair.partner].map((person) => (
              <div key={person.userId} className="matched-pair-avatar-item">
                {getAvatarSrc(person.profileImageUrl) ? (
                  <img src={getAvatarSrc(person.profileImageUrl)!} alt="" />
                ) : (
                  <div className="matched-pair-avatar-placeholder">{person.nickname.slice(0, 1)}</div>
                )}
                <span>{person.nickname}</span>
              </div>
            ))}
          </div>
          <h2>{pair.me.nickname}님과 {pair.partner.nickname}님의 하우스</h2>
          <p className="profile-card-meta">{pair.region ?? "지역 정보 없음"}</p>
        </div>
      )}

      <div className="house-menu">
        {HOUSE_MENU_ITEMS.map((item) => (
          <Link key={item.to} to={`/house/${id}/${item.to}`} className="house-menu-card">
            <strong>{item.label}</strong>
            <span>{item.description}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default HousePage;
