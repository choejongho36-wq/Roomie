import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { API_ORIGIN, getRecommendations, getSurveyComparison } from "../api";
import type { RecommendationResult, SurveyComparisonResult } from "../types/survey";
import {
  ALL_DISTRICTS,
  ALL_ZONES,
  SEOUL_ZONES,
  getDistrictsForZone,
  regionMatchesDistrict,
  regionMatchesZone,
} from "../data/SeoulDistricts";
import "./RecommendationPage.css";
import "./ProfileBoardPage.css";

const getProfileImageSrc = (url: string | null) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
};

const getInitial = (nickname: string) => nickname.trim().charAt(0) || "?";

function ProfileBoardPage() {
  const { token } = useAuth();
  const [profiles, setProfiles] = useState<RecommendationResult[] | null>(null);
  const [error, setError] = useState("");
  const [zoneFilter, setZoneFilter] = useState(ALL_ZONES);
  const [districtFilter, setDistrictFilter] = useState(ALL_DISTRICTS);

  const [comparison, setComparison] = useState<SurveyComparisonResult | null>(null);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [comparisonLoadingUserId, setComparisonLoadingUserId] = useState<number | null>(null);
  const [comparisonError, setComparisonError] = useState("");
  const [highlightedCategory, setHighlightedCategory] = useState<string | null>(null);
  const comparisonItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!token) {
      setProfiles(null);
      return;
    }

    let isMounted = true;

    getRecommendations(token)
      .then((result) => {
        if (isMounted) setProfiles(result);
      })
      .catch(() => {
        if (isMounted) setError("프로필 목록을 불러오지 못했습니다.");
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const districtOptions = useMemo(() => getDistrictsForZone(zoneFilter), [zoneFilter]);

  const handleZoneChange = (zone: string) => {
    setZoneFilter(zone);
    setDistrictFilter(ALL_DISTRICTS);
  };

  const filteredProfiles = useMemo(() => {
    if (!profiles) return [];
    if (zoneFilter === ALL_ZONES) return profiles;
    if (districtFilter === ALL_DISTRICTS) {
      return profiles.filter((item) => regionMatchesZone(item.region, zoneFilter));
    }
    return profiles.filter((item) => regionMatchesDistrict(item.region, districtFilter));
  }, [profiles, zoneFilter, districtFilter]);

  const isFiltered = zoneFilter !== ALL_ZONES;

  const openComparison = (event: MouseEvent<HTMLButtonElement>, item: RecommendationResult) => {
    event.stopPropagation();
    if (!token) return;

    setIsComparisonOpen(true);
    setComparison(null);
    setComparisonError("");
    setComparisonLoadingUserId(item.userId);

    getSurveyComparison(token, item.userId)
      .then(setComparison)
      .catch(() => setComparisonError("설문 비교 데이터를 불러오지 못했습니다."))
      .finally(() => setComparisonLoadingUserId(null));
  };

  const closeComparison = () => {
    setIsComparisonOpen(false);
    setComparisonError("");
    setComparisonLoadingUserId(null);
    setHighlightedCategory(null);
  };

  const scrollToCategory = (category: string) => {
    const target = comparisonItemRefs.current[category];
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "start" });
    setHighlightedCategory(category);

    if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    highlightTimeoutRef.current = setTimeout(() => setHighlightedCategory(null), 1800);
  };

  return (
    <div className="profile-board-page">
      <div className="profile-board-header">
        <div>
          <h1>호환성 높은 프로필</h1>
          <p className="profile-board-subtitle">설문 기반 호환성 점수가 높은 순서대로 모든 프로필을 볼 수 있어요.</p>
        </div>

        <div className="profile-board-filter">
          <label htmlFor="profile-zone-filter">지역</label>
          <select
            id="profile-zone-filter"
            value={zoneFilter}
            onChange={(event) => handleZoneChange(event.target.value)}
          >
            <option value={ALL_ZONES}>전체 권역</option>
            {SEOUL_ZONES.map((item) => (
              <option key={item.zone} value={item.zone}>
                {item.zone}
              </option>
            ))}
          </select>

          <select
            id="profile-district-filter"
            value={districtFilter}
            onChange={(event) => setDistrictFilter(event.target.value)}
            disabled={zoneFilter === ALL_ZONES}
          >
            <option value={ALL_DISTRICTS}>{zoneFilter === ALL_ZONES ? "구 선택" : `${zoneFilter} 전체`}</option>
            {districtOptions.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="profile-board-error">{error}</p>}

      {profiles === null ? (
        <p className="profile-board-empty">로딩 중...</p>
      ) : filteredProfiles.length === 0 ? (
        <p className="profile-board-empty">
          {isFiltered ? "해당 지역의 프로필이 없습니다." : "추천 프로필이 없습니다."}
        </p>
      ) : (
        <ul className="profile-board-list">
          {filteredProfiles.map((item) => {
            const imageSrc = getProfileImageSrc(item.profileImageUrl);

            return (
              <li key={item.userId} className="profile-board-row">
                <div className="profile-board-row-main">
                  {imageSrc ? (
                    <img className="profile-board-avatar" src={imageSrc} alt={item.nickname} />
                  ) : (
                    <div className="profile-board-avatar profile-board-avatar-fallback" aria-hidden="true">
                      {getInitial(item.nickname)}
                    </div>
                  )}

                  <div className="profile-board-info">
                    <h2>{item.nickname}</h2>
                    <p>
                      {item.age}세{item.job ? ` | ${item.job}` : " | 직업 정보 준비 중"}
                      {" · "}
                      {item.region ?? "지역 정보 준비 중"}
                    </p>
                    <div className="profile-board-tags">
                      {item.tags.length > 0 ? (
                        item.tags.slice(0, 4).map((tag) => (
                          <span key={tag} className="profile-board-tag">
                            #{tag}
                          </span>
                        ))
                      ) : (
                        <span className="profile-board-tag is-empty">태그 준비 중</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="profile-board-score">
                  <strong>{item.compatibilityScore}%</strong>
                  <button
                    type="button"
                    className="profile-compare-button"
                    onClick={(event) => openComparison(event, item)}
                  >
                    호환성 점수 <span aria-hidden="true">&gt;</span>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {isComparisonOpen && (
        <div className="comparison-modal-backdrop" onClick={closeComparison}>
          <section
            className="comparison-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="board-comparison-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="comparison-modal-header">
              <div>
                <p className="comparison-modal-eyebrow">설문 비교</p>
                <h2 id="board-comparison-title">
                  {comparison ? `${comparison.nickname}님과의 호환성` : "호환성 비교"}
                </h2>
              </div>
              <button type="button" className="comparison-modal-close" onClick={closeComparison}>
                닫기
              </button>
            </div>

            {comparisonLoadingUserId !== null && (
              <p className="comparison-modal-state">비교 데이터를 불러오는 중...</p>
            )}

            {comparisonError && <p className="comparison-modal-error">{comparisonError}</p>}

            {comparison && (
              <>
                <div className="comparison-modal-score">
                  <strong>{comparison.compatibilityScore}%</strong>
                  <span>{comparison.nickname}님과 나의 설문 기반 호환성 점수</span>
                </div>

                <div className="comparison-highlight-grid">
                  <div className="comparison-highlight-panel comparison-highlight-panel-compact">
                    <h3>맞는 포인트 TOP3</h3>
                    <div className="comparison-highlight-chips">
                      {comparison.topReasons.map((item) => (
                        <button
                          key={`reason-${item.category}`}
                          type="button"
                          className="comparison-highlight-chip"
                          onClick={() => scrollToCategory(item.category)}
                        >
                          {item.category}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="comparison-highlight-panel comparison-highlight-panel-compact">
                    <h3>다른 포인트 TOP3</h3>
                    <div className="comparison-highlight-chips">
                      {comparison.differences.map((item) => (
                        <button
                          key={`difference-${item.category}`}
                          type="button"
                          className="comparison-highlight-chip comparison-highlight-chip-diff"
                          onClick={() => scrollToCategory(item.category)}
                        >
                          {item.category}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="comparison-table-wrap">
                  <div className="comparison-table-header">
                    <h3>설문 답변 비교</h3>
                    <span>나와 {comparison.nickname}</span>
                  </div>
                  <div className="comparison-table">
                    <div className="comparison-table-row comparison-table-head">
                      <span>항목</span>
                      <span>나</span>
                      <span>{comparison.nickname}</span>
                      <span>차이</span>
                    </div>
                    {comparison.items.map((item) => (
                      <div
                        key={item.questionId}
                        ref={(el) => {
                          comparisonItemRefs.current[item.category] = el;
                        }}
                        className={`comparison-table-row${
                          item.category === highlightedCategory ? " is-target" : ""
                        }`}
                      >
                        <span className="comparison-category">{item.category}</span>
                        <span>{item.myAnswer}</span>
                        <span>{item.otherAnswer}</span>
                        <span className={`comparison-level level-${item.difference}`}>
                          {item.matchLevel}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default ProfileBoardPage;
