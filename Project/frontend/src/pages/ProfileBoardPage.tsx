import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  API_ORIGIN,
  getRecommendations,
  getSurveyComparison,
  getSurveyComparisonAiExplanation,
} from "../api";
import type { RecommendationResult, SurveyComparisonResult } from "../types/survey";
import { regionMatchesDistrict, regionMatchesDong } from "../data/SeoulDistricts";
import RegionPicker, { type RegionToken } from "../components/RegionPicker";
import RentRangeDropdown from "../components/RentRangeDropdown";
import Pagination from "../components/Pagination";
import defaultAvatar from "../assets/Roomie_logo.png";
import "./RecommendationPage.css";
import "./ProfileBoardPage.css";

const getProfileImageSrc = (url: string | null) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
};

function ProfileBoardPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<RecommendationResult[] | null>(null);
  const [error, setError] = useState("");

  const [selectedRegions, setSelectedRegions] = useState<RegionToken[]>([]);
  const RENT_MIN = 50;
  const RENT_MAX = 100;
  const [rentRange, setRentRange] = useState<[number, number]>([RENT_MIN, RENT_MAX]);
  const [selectedBoardUserId, setSelectedBoardUserId] = useState<number | null>(null);
  // 목록을 스크롤 대신 페이지 단위로 넘겨서, 페이지 전체가 스크롤 없이 헤더~푸터가 한 화면에 보이게 한다.
  const PAGE_SIZE = 6;
  const [page, setPage] = useState(0);

  const [selectedProfile, setSelectedProfile] = useState<RecommendationResult | null>(null);
  const [comparison, setComparison] = useState<SurveyComparisonResult | null>(null);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [comparisonLoadingUserId, setComparisonLoadingUserId] = useState<number | null>(null);
  const [comparisonError, setComparisonError] = useState("");
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiExplanationLoading, setAiExplanationLoading] = useState(false);
  const [aiExplanationError, setAiExplanationError] = useState("");

  // 이 페이지에 있는 동안만 페이지 전체 스크롤을 막고 뷰포트 높이에 레이아웃을 맞춰서,
  // 헤더~푸터가 한 화면에 다 보이고 프로필 목록만 자체 스크롤되게 한다.
  // (CSS는 ProfileBoardPage.css의 #root.profile-board-viewport-lock 규칙 참고)
  useEffect(() => {
    const root = document.getElementById("root");
    root?.classList.add("profile-board-viewport-lock");
    return () => {
      root?.classList.remove("profile-board-viewport-lock");
    };
  }, []);

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

  const isRentFiltered = rentRange[0] !== RENT_MIN || rentRange[1] !== RENT_MAX;

  const filteredProfiles = useMemo(() => {
    if (!profiles) return [];
    let result = profiles;
    if (selectedRegions.length > 0) {
      result = result.filter((item) =>
        selectedRegions.some((regionToken) =>
          regionToken.dong
            ? regionMatchesDong(item.region, regionToken.dong)
            : regionMatchesDistrict(item.region, regionToken.district)
        )
      );
    }
    if (isRentFiltered) {
      // 단일 값이 아니라 "구간이 겹치는지"로 판단한다. 예) 슬라이더를 60~70으로 좁혀도
      // 설문에서 70~100을 답한 사람은 70에서 겹치므로 포함된다.
      // 전세·년세 응답이거나 설문에 이 문항 응답이 없는(min/max가 null인) 사람은
      // 월세 범위를 실제로 좁혀서 찾는 중이라는 뜻이므로 자연스럽게 결과에서 제외한다.
      result = result.filter(
        (item) =>
          item.desiredRentMin != null &&
          item.desiredRentMax != null &&
          item.desiredRentMin <= rentRange[1] &&
          item.desiredRentMax >= rentRange[0]
      );
    }
    return result;
  }, [profiles, selectedRegions, isRentFiltered, rentRange]);

  const isFiltered = selectedRegions.length > 0 || isRentFiltered;

  // 지역/월세 필터가 바뀌면 이전 필터에서 보던 페이지 번호가 아니라 1페이지부터 다시 보여준다.
  useEffect(() => {
    setPage(0);
  }, [selectedRegions, rentRange]);

  const totalPages = Math.max(1, Math.ceil(filteredProfiles.length / PAGE_SIZE));
  // 필터링 결과가 줄어들어 지금 페이지가 범위를 벗어나면 마지막 유효 페이지로 되돌린다.
  const safePage = Math.min(page, totalPages - 1);
  const pagedProfiles = filteredProfiles.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  useEffect(() => {
    if (pagedProfiles.length === 0) {
      setSelectedBoardUserId(null);
      return;
    }
    if (!pagedProfiles.some((item) => item.userId === selectedBoardUserId)) {
      setSelectedBoardUserId(pagedProfiles[0].userId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagedProfiles, selectedBoardUserId]);

  const selectedBoardProfile =
    pagedProfiles.find((item) => item.userId === selectedBoardUserId) ?? null;

  const openComparison = (event: MouseEvent<HTMLButtonElement>, item: RecommendationResult) => {
    event.stopPropagation();
    if (!token) return;

    setSelectedProfile(item);
    setIsComparisonOpen(true);
    setComparison(null);
    setComparisonError("");
    setComparisonLoadingUserId(item.userId);
    setAiExplanation(null);
    setAiExplanationError("");
    setAiExplanationLoading(false);

    getSurveyComparison(token, item.userId)
      .then((result) => {
        setComparison(result);
        setAiExplanationLoading(true);
        getSurveyComparisonAiExplanation(token, item.userId)
          .then((res) => setAiExplanation(res.explanation))
          .catch(() => setAiExplanationError("AI 설명을 불러오지 못했어요."))
          .finally(() => setAiExplanationLoading(false));
      })
      .catch(() => setComparisonError("설문 비교 데이터를 불러오지 못했습니다."))
      .finally(() => setComparisonLoadingUserId(null));
  };

  const closeComparison = () => {
    setIsComparisonOpen(false);
    setComparisonError("");
    setComparisonLoadingUserId(null);
    setAiExplanation(null);
    setAiExplanationError("");
    setAiExplanationLoading(false);
  };

  return (
    <div className="profile-board-page">
      <div className="profile-board-header">
        <div>
          <h1>점수 높은 프로필</h1>
          <p className="profile-board-subtitle">설문 기반 점수가 높은 순서대로 모든 프로필을 볼 수 있어요.</p>
        </div>

        <div className="profile-board-region-field">
          <RegionPicker selected={selectedRegions} onChange={setSelectedRegions} hideBadge />
          <RentRangeDropdown min={RENT_MIN} max={RENT_MAX} value={rentRange} onChange={setRentRange} />
        </div>
      </div>

      {error && <p className="profile-board-error">{error}</p>}

      {profiles === null ? (
        <p className="profile-board-empty">로딩 중...</p>
      ) : filteredProfiles.length === 0 ? (
        <p className="profile-board-empty">
          {isFiltered ? "조건에 맞는 프로필이 없습니다." : "추천 프로필이 없습니다."}
        </p>
      ) : (
        <div className="profile-board-layout">
          <div className="profile-board-list-col">
          <ul className="profile-board-list">
            {pagedProfiles.map((item) => {
              const imageSrc = getProfileImageSrc(item.profileImageUrl);
              const isSelected = item.userId === selectedBoardUserId;

              return (
                <li key={item.userId}>
                  <button
                    type="button"
                    className={`profile-board-list-item${isSelected ? " is-selected" : ""}`}
                    onClick={() => setSelectedBoardUserId(item.userId)}
                  >
                    <img
                      className="profile-board-list-avatar"
                      src={imageSrc ?? defaultAvatar}
                      alt={item.nickname}
                    />
                    <span className="profile-board-list-info">
                      <strong>{item.nickname}</strong>
                      <span className="profile-board-list-age-region">
                        {item.age}세 · {item.region ?? "지역 정보 준비 중"}
                      </span>
                    </span>
                    <span className="profile-board-list-score">{item.compatibilityScore}점</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
          </div>

          {selectedBoardProfile && (
            <div className="profile-board-detail">
              <div className="profile-board-detail-header">
                <img
                  className="profile-board-detail-avatar"
                  src={getProfileImageSrc(selectedBoardProfile.profileImageUrl) ?? defaultAvatar}
                  alt={selectedBoardProfile.nickname}
                />
                <div className="profile-board-detail-name-block">
                  <p className="profile-board-detail-name">{selectedBoardProfile.nickname}</p>
                  <p className="profile-board-detail-meta">
                    {selectedBoardProfile.age}세
                    {selectedBoardProfile.job ? ` · ${selectedBoardProfile.job}` : " · 직업 정보 준비 중"}
                    {" · "}
                    {selectedBoardProfile.region ?? "지역 정보 준비 중"}
                  </p>
                </div>
              </div>

              <p className="profile-board-detail-bio">
                {selectedBoardProfile.bio && selectedBoardProfile.bio.trim()
                  ? selectedBoardProfile.bio
                  : "아직 소개글이 없어요."}
              </p>

              <div className="profile-board-detail-tags">
                {selectedBoardProfile.tags.length > 0 ? (
                  selectedBoardProfile.tags.slice(0, 6).map((tag) => (
                    <span key={tag} className="profile-board-tag">
                      #{tag}
                    </span>
                  ))
                ) : (
                  <span className="profile-board-tag is-empty">태그 준비 중</span>
                )}
              </div>

              <button
                type="button"
                className="btn btn-primary profile-board-detail-compare-button"
                onClick={(event) => openComparison(event, selectedBoardProfile)}
              >
                자세히 비교
              </button>
            </div>
          )}
        </div>
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
              <button type="button" className="comparison-modal-close" onClick={closeComparison}>
                닫기
              </button>
            </div>

            {comparisonLoadingUserId !== null && (
              <p className="comparison-modal-state">비교 데이터를 불러오는 중...</p>
            )}

            {comparisonError && <p className="comparison-modal-error">{comparisonError}</p>}

            {comparison && (
              <div className="comparison-modal-body">
                <div className="comparison-modal-grid">
                  <div className="comparison-panel comparison-panel-compare">
                    <div className="comparison-panel-header">
                      <p className="comparison-panel-title" id="board-comparison-title">
                        {comparison.nickname}님과의 궁합
                      </p>
                      <div
                        className="comparison-gauge"
                        style={
                          {
                            "--gauge-percent": `${Math.max(0, Math.min(comparison.compatibilityScore, 100))}%`,
                          } as CSSProperties
                        }
                      >
                        <div className="comparison-gauge-ring">
                          <div className="comparison-gauge-center">
                            <div className="comparison-gauge-score">
                              <span className="comparison-gauge-score-value">{comparison.compatibilityScore}</span>
                              <span className="comparison-gauge-score-unit">점</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="comparison-points-grid">
                      <div>
                        <p className="comparison-points-label">맞는 포인트</p>
                        <div className="comparison-points-list">
                          {comparison.topReasons.map((item) => (
                            <span key={`reason-${item.category}`} className="comparison-point-chip">
                              {item.category}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="comparison-points-label">다른 포인트</p>
                        <div className="comparison-points-list">
                          {comparison.differences.map((item) => (
                            <span
                              key={`difference-${item.category}`}
                              className="comparison-point-chip comparison-point-chip-diff"
                            >
                              {item.category}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="comparison-panel comparison-panel-profile">
                    <img
                      className="comparison-profile-avatar"
                      src={getProfileImageSrc(selectedProfile?.profileImageUrl ?? null) ?? defaultAvatar}
                      alt={comparison.nickname}
                    />
                    <p className="comparison-profile-name">{comparison.nickname}</p>
                    <p className="comparison-profile-meta">
                      {selectedProfile?.age}세 · {selectedProfile?.job} · {selectedProfile?.region}
                    </p>
                    <p className="comparison-profile-bio">
                      {selectedProfile?.bio && selectedProfile.bio.trim()
                        ? selectedProfile.bio
                        : "아직 소개글이 없어요."}
                    </p>
                    {selectedProfile && selectedProfile.tags.length > 0 && (
                      <div className="comparison-profile-tags">
                        {selectedProfile.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="comparison-profile-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="comparison-ai-explanation">
                  <p className="comparison-ai-label">AI 궁합 설명</p>
                  {aiExplanationLoading ? (
                    <p className="comparison-ai-loading">AI가 설명을 작성하고 있어요...</p>
                  ) : aiExplanationError ? (
                    <p className="comparison-ai-error">{aiExplanationError}</p>
                  ) : (
                    <p className="comparison-ai-text">{aiExplanation}</p>
                  )}
                </div>

                <div className="comparison-modal-footer">
                  <button
                    type="button"
                    className="btn btn-primary comparison-start-chat-button"
                    onClick={() =>
                      navigate(`/mypage/chat?userId=${comparison.userId}`, {
                        state: { nickname: comparison.nickname },
                      })
                    }
                  >
                    {comparison.nickname}님에게 첫 메시지 보내기
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default ProfileBoardPage;
