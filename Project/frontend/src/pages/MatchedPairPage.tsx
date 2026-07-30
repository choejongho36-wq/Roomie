import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_ORIGIN, getMatchedPair, updateMatchedPairConditions } from "../api";
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
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    if (!token || !id) return;
    getMatchedPair(token, Number(id))
      .then((data) => {
        setPair(data);
        const parsed = parseRegionToken(data.region);
        setRegionTokens(parsed ? [parsed] : []);
        setBudgetMin(data.budgetMin != null ? String(data.budgetMin) : "");
        setBudgetMax(data.budgetMax != null ? String(data.budgetMax) : "");
        setMoveInDate(data.moveInDate ?? "");
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
        budgetMin: budgetMin ? Number(budgetMin) : null,
        budgetMax: budgetMax ? Number(budgetMax) : null,
        moveInDate: moveInDate || null,
      });
      setPair(updated);
      setSaveMessage("조건이 저장됐어요. 아래 검색 링크도 새 조건으로 갱신됐어요.");
    } catch {
      setSaveMessage("저장에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

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
              예산(최소, 만원)
              <input
                type="number"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                placeholder="예) 500"
              />
            </label>
            <label>
              예산(최대, 만원)
              <input
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="예) 1000"
              />
            </label>
          </div>
          <label>
            입주 희망일
            <input type="date" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} />
          </label>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "저장 중..." : "조건 저장"}
          </button>
          {saveMessage && <p className="matched-pair-save-message">{saveMessage}</p>}
        </div>
      </section>

      <section className="matched-pair-section">
        <h2>이 조건으로 방 찾아보기</h2>
        <p className="matched-pair-hint">
          네이버부동산/직방은 공식 검색 링크를 지원하지 않아서, 대신 아래 링크로 안내해드려요.
          다방은 지도에서 실제 매물까지 바로 볼 수 있어요.
        </p>
        <div className="matched-pair-links">
          <a href={pair.externalLinks.dabangMapUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
            다방 지도에서 매물 보기
          </a>
          <a href={pair.externalLinks.naverSearchUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
            네이버 검색
          </a>
          <a href={pair.externalLinks.googleSearchUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
            구글 검색
          </a>
        </div>
      </section>
    </div>
  );
}

export default MatchedPairPage;