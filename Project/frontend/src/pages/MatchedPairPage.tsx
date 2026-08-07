import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_ORIGIN, confirmMatchedPair, getMatchedPair, updateMatchedPairConditions } from "../api";
import type { MatchedPair } from "../types/matchedPair";
import RegionPicker, { type RegionToken, parseRegionToken } from "../components/RegionPicker";
import "./MatchedPairPage.css";

const getAvatarSrc = (url: string | null) => (url ? `${API_ORIGIN}${url}` : null);

function MatchedPairPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [pair, setPair] = useState<MatchedPair | null>(null);
  const [loadError, setLoadError] = useState("");

  const [regionTokens, setRegionTokens] = useState<RegionToken[]>([]);
  const [depositMax, setDepositMax] = useState("");
  const [monthlyRentMax, setMonthlyRentMax] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!token || !id) return;
    getMatchedPair(token, Number(id))
      .then((data) => {
        setPair(data);
        const parsed = parseRegionToken(data.region);
        setRegionTokens(parsed ? [parsed] : []);
        setDepositMax(data.depositMax != null ? String(data.depositMax) : "");
        setMonthlyRentMax(data.monthlyRentMax != null ? String(data.monthlyRentMax) : "");
      })
      .catch(() => setLoadError("정보를 불러오지 못했어요. 접근 권한이 없거나 존재하지 않는 페이지예요."));
  }, [token, id]);

  const handleSave = async () => {
    if (!token || !id) return;
    setSaving(true);
    setSaveMessage("");
    try {
      const updated = await updateMatchedPairConditions(token, Number(id), {
        region: regionTokens[0]?.label ?? null,
        depositMax: depositMax ? Number(depositMax) : null,
        monthlyRentMax: monthlyRentMax ? Number(monthlyRentMax) : null,
      });
      setPair(updated);
      setSaveMessage("조건이 저장됐어요. 아래 검색 링크도 새 조건으로 갱신됐어요.");
    } catch {
      setSaveMessage("저장에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmHouse = async () => {
    if (!token || !id) return;
    setConfirming(true);
    try {
      const updated = await confirmMatchedPair(token, Number(id));
      setPair(updated);
      if (updated.status === "CONFIRMED") {
        navigate(`/house/${id}`);
      }
    } finally {
      setConfirming(false);
    }
  };

  // 나는 확정했는데 상대방이 아직 안 했으면, 상대방이 확정하는 순간 자동으로 하우스로 넘어가게 주기적으로 확인
  useEffect(() => {
    if (!token || !id || !pair) return;
    if (pair.status === "CONFIRMED" || !pair.myConfirmed) return;

    const interval = setInterval(() => {
      getMatchedPair(token, Number(id)).then((updated) => {
        setPair(updated);
        if (updated.status === "CONFIRMED") {
          navigate(`/house/${id}`);
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [token, id, pair, navigate]);

  if (loadError) {
    return (
      <div className="matched-pair-page">
        <p className="matched-pair-error">{loadError}</p>
        <button className="btn btn-primary" onClick={() => navigate("/")}>
          홈으로 가기
        </button>
      </div>
    );
  }

  if (!pair) {
    return (
      <div className="matched-pair-page">
        <p>불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="matched-pair-page">
      <div className="matched-pair-hero">
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
        <h1>이제 함께 살 방을 찾아볼까요?</h1>
        <p>두 분의 희망 조건을 정하면, 그 조건으로 바로 검색할 수 있는 링크를 만들어드려요.</p>
      </div>

      <section className="matched-pair-section">
        <h2>참고 — 각자 희망 지역</h2>
        <div className="matched-pair-reference">
          <span>{pair.me.nickname}: {pair.me.region ?? "설정 안 함"}</span>
          <span>{pair.partner.nickname}: {pair.partner.region ?? "설정 안 함"}</span>
        </div>
      </section>

      <section className="matched-pair-section">
        <h2>공통 조건 정하기</h2>
        <div className="matched-pair-form">
          <label>
            희망 지역
            <RegionPicker
              selected={regionTokens}
              onChange={setRegionTokens}
              multiple={false}
              variant="inline"
              triggerLabel="지역 선택"
              emptyHint="지역을 선택해주세요."
            />
          </label>
          <div className="matched-pair-form-row">
            <label>
              보증금 최대 (만원)
              <input
                type="number"
                value={depositMax}
                onChange={(e) => setDepositMax(e.target.value)}
                placeholder="예) 1000"
              />
            </label>
            <label>
              월세 최대 (만원)
              <input
                type="number"
                value={monthlyRentMax}
                onChange={(e) => setMonthlyRentMax(e.target.value)}
                placeholder="예) 58"
              />
            </label>
          </div>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "저장 중..." : "조건 저장"}
          </button>
          {saveMessage && <p className="matched-pair-save-message">{saveMessage}</p>}
        </div>
      </section>

      <section className="matched-pair-section">
        <h2>이 조건으로 방 찾아보기</h2>
        <p className="matched-pair-hint">다방 지도에서 실제 매물을 바로 확인할 수 있어요.</p>
        <div className="matched-pair-links">
          <a href={pair.dabangMapUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
            다방 지도에서 매물 보기
          </a>
        </div>
      </section>

      <section className="matched-pair-section">
        <h2>방을 구하셨나요?</h2>
        <p className="matched-pair-hint">
          함께 살 방이 정해졌다면, 하우스 공간으로 넘어가서 정산/청소 관리를 시작해보세요.
          <br />
          두 분 모두 확정해야 하우스가 열려요.
        </p>
        <div className="matched-pair-confirm-status">
          <span className={pair.myConfirmed ? "matched-pair-confirm-done" : ""}>
            {pair.me.nickname}: {pair.myConfirmed ? "확정함 ✓" : "미확정"}
          </span>
          <span className={pair.partnerConfirmed ? "matched-pair-confirm-done" : ""}>
            {pair.partner.nickname}: {pair.partnerConfirmed ? "확정함 ✓" : "미확정"}
          </span>
        </div>
        {pair.myConfirmed ? (
          <p className="matched-pair-hint">상대방이 확정하면 자동으로 하우스로 이동해요. 잠시만 기다려주세요.</p>
        ) : (
          <div className="matched-pair-confirm-actions">
            <button className="btn btn-primary" onClick={handleConfirmHouse} disabled={confirming}>
              {confirming ? "처리 중..." : "하우스로 이동"}
            </button>
            <button
              className="btn btn-outline"
              onClick={() => navigate(`/mypage/chat?userId=${pair.partner.userId}`)}
              disabled={confirming}
            >
              확정 취소하기
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default MatchedPairPage;