import { useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
  API_ORIGIN,
  getRecommendations,
  getSurveyComparison,
  getSurveyComparisonAiExplanation,
  sendChatRequest,
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

const SMOKING_TYPE_LABELS: Record<string, string> = {
  CIGARETTE: "연초",
  HEATED: "궐련형",
  LIQUID: "액상",
};

// "SMOKER" + "HEATED" -> "흡연자(궐련형)", "NON_SMOKER" -> "비흡연자", 정보 없으면 null
const formatSmoking = (smoking?: string | null, smokingType?: string | null): string | null => {
  if (smoking === "NON_SMOKER") return "비흡연자";
  if (smoking === "SMOKER") {
    const typeLabel = smokingType ? SMOKING_TYPE_LABELS[smokingType] : null;
    return typeLabel ? `흡연자(${typeLabel})` : "흡연자";
  }
  return null;
};

function ProfileBoardPage() {
  const { token } = useAuth();
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
  const [isSendConfirmOpen, setIsSendConfirmOpen] = useState(false);
  const [isRequestSending, setIsRequestSending] = useState(false);
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [requestSendError, setRequestSendError] = useState("");
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

  const loadComparison = (item: RecommendationResult) => {
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

  const openComparison = (event: MouseEvent<HTMLButtonElement>, item: RecommendationResult) => {
    event.stopPropagation();
    loadComparison(item);
  };

  // recommend 페이지와 동일하게, 모달을 연 채로 화살표로 같은 페이지 안의 다른
  // 프로필을 넘겨볼 수 있게 한다. 페이지 경계는 안 넘어간다(단순하게 유지).
  const selectedProfileIndex = pagedProfiles.findIndex((item) => item.userId === selectedProfile?.userId);
  const hasPrevProfile = selectedProfileIndex > 0;
  const hasNextProfile = selectedProfileIndex !== -1 && selectedProfileIndex < pagedProfiles.length - 1;

  const goToPrevProfile = () => {
    if (!hasPrevProfile) return;
    loadComparison(pagedProfiles[selectedProfileIndex - 1]);
  };

  const goToNextProfile = () => {
    if (!hasNextProfile) return;
    loadComparison(pagedProfiles[selectedProfileIndex + 1]);
  };

  const closeComparison = () => {
    setIsComparisonOpen(false);
    setComparisonError("");
    setComparisonLoadingUserId(null);
    setAiExplanation(null);
    setAiExplanationError("");
    setAiExplanationLoading(false);
    setIsSendConfirmOpen(false);
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
                        {formatSmoking(item.smoking, item.smokingType) && (
                          <> · {formatSmoking(item.smoking, item.smokingType)}</>
                        )}
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
                    {formatSmoking(selectedBoardProfile.smoking, selectedBoardProfile.smokingType) && (
                      <> · {formatSmoking(selectedBoardProfile.smoking, selectedBoardProfile.smokingType)}</>
                    )}
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
        <div className="comparison-modal-backdrop">
          <button
            type="button"
            className="comparison-nav-arrow comparison-nav-prev"
            onClick={goToPrevProfile}
            disabled={!hasPrevProfile}
            aria-label="이전 프로필 보기"
          >
            ◀
          </button>

          <section
            className="comparison-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="board-comparison-title"
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
                      <div className="comparison-score-badge">
                        <div className="comparison-score-badge-value">{comparison.compatibilityScore}</div>
                        <div className="comparison-score-badge-unit">점 · 궁합</div>
                        <div className="comparison-score-badge-track">
                          <div
                            className="comparison-score-badge-fill"
                            style={{ width: `${Math.max(0, Math.min(comparison.compatibilityScore, 100))}%` }}
                          />
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
                    <div className="comparison-profile-preferences">
                      <span className="comparison-preference-hover">
                        희망 조건
                        <span className="comparison-preference-tooltip">
                          <span>
                            선호지역 :{" "}
                            <span className="comparison-preference-value">
                              {selectedProfile?.region ?? "정보 없음"}
                            </span>
                          </span>
                          <span>
                            희망 월세 :{" "}
                            <span className="comparison-preference-value">
                              {comparisonLoadingUserId !== null
                                ? "불러오는 중..."
                                : comparison.items.find((item) => item.category === "월 생활비")?.otherAnswer ??
                                  "정보 없음"}
                            </span>
                          </span>
                        </span>
                      </span>
                    </div>
                    <img
                      className="comparison-profile-avatar"
                      src={getProfileImageSrc(selectedProfile?.profileImageUrl ?? null) ?? defaultAvatar}
                      alt={comparison.nickname}
                    />
                    <p className="comparison-profile-name">{comparison.nickname}</p>
                    <p className="comparison-profile-meta">
                      {selectedProfile?.age}세 · {selectedProfile?.job} · {selectedProfile?.region}
                      {formatSmoking(selectedProfile?.smoking, selectedProfile?.smokingType) && (
                        <> · {formatSmoking(selectedProfile?.smoking, selectedProfile?.smokingType)}</>
                      )}
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
                    onClick={() => {
                      setIsRequestSent(false);
                      setRequestSendError("");
                      setIsSendConfirmOpen(true);
                    }}
                  >
                    채팅 신청하기
                  </button>
                </div>
              </div>
            )}
          </section>

          <button
            type="button"
            className="comparison-nav-arrow comparison-nav-next"
            onClick={goToNextProfile}
            disabled={!hasNextProfile}
            aria-label="다음 프로필 보기"
          >
            ▶
          </button>

          {isSendConfirmOpen && comparison && (
            <div className="send-confirm-backdrop">
              <div className="send-confirm-box" role="dialog" aria-modal="true">
                {isRequestSent ? (
                  <>
                    <p className="send-confirm-text">채팅 신청을 보냈습니다!</p>
                    <p className="send-confirm-subtext">상대가 수락하면 채팅방이 열려요.</p>
                    <div className="send-confirm-actions">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setIsSendConfirmOpen(false)}
                      >
                        확인
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="send-confirm-text">채팅을 신청하시겠어요?</p>
                    {requestSendError && <p className="send-confirm-error">{requestSendError}</p>}
                    <div className="send-confirm-actions">
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => setIsSendConfirmOpen(false)}
                        disabled={isRequestSending}
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={isRequestSending}
                        onClick={() => {
                          if (!token) return;
                          setIsRequestSending(true);
                          setRequestSendError("");
                          sendChatRequest(token, comparison.userId)
                            .then(() => setIsRequestSent(true))
                            .catch((err) => {
                              const message =
                                axios.isAxiosError(err) && typeof err.response?.data === "string"
                                  ? err.response.data
                                  : "채팅 신청에 실패했습니다.";
                              setRequestSendError(message);
                            })
                            .finally(() => setIsRequestSending(false));
                        }}
                      >
                        신청 보내기
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProfileBoardPage;