import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Camera, ChevronRight, LogOut, MapPin, Pencil, Plus, Sparkles, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { updateTags, updateBio, updateSmoking, updateRegion, changePassword, getMySurveys, withdraw, API_ORIGIN } from "../../api";
import RegionPicker, { parseRegionToken, type RegionToken } from "../../components/RegionPicker";
import {
  PROFILE_TAG_GROUPS,
  PROFILE_TAGS,
  PROFILE_TAG_SET,
  MAX_PROFILE_TAGS,
  MAX_CUSTOM_TAG_LENGTH,
  MBTI_TAGS,
  MBTI_TAG_SET,
  type TagGroup,
} from "../../data/ProfileTags";
import defaultAvatar from "../../assets/Roomie_logo.png";
import NicknameModal from "./NicknameModal";
import "./MyProfilePage.css";

// 목업(마이페이지 리디자인)에서 그대로 가져온 팔레트: 크림 배경, 화이트 카드, 오렌지 포인트
const T = {
  card: "#FFFFFF",
  accent: "#F2793A",
  accentSoft: "#FDEDE2",
  textPrimary: "#241C15",
  textMuted: "#7D7263",
  hairline: "#DCCFBC",
  mbtiBg: "#EEF1FB",
  mbtiText: "#4A5A9E",
  customBg: "#F6EEF8",
  customText: "#8C4F96",
  danger: "#E03131",
};

const GENDER_LABEL: Record<string, string> = { M: "남성", F: "여성" };
// 궐련형/액상형은 전자담배로 구분해서 표시, 연초는 그냥 흡연자로 표시
const ECIG_TYPE_LABEL: Record<string, string> = { HEATED: "궐련", LIQUID: "액상" };
const formatSmokingLabel = (smoking?: string | null, smokingType?: string | null): string | null => {
  if (smoking === "NON_SMOKER") return "비흡연자";
  if (smoking === "SMOKER") {
    const ecigLabel = smokingType ? ECIG_TYPE_LABEL[smokingType] : null;
    return ecigLabel ? `전자담배(${ecigLabel})` : "흡연자";
  }
  return null;
};
const MAX_BIO_LENGTH = 150;

function getAge(birthDate: string) {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

function extractErrorMessage(err: unknown, fallback: string): string {
  return axios.isAxiosError(err) && typeof err.response?.data === "string" ? err.response.data : fallback;
}

// 지역은 콤마로 이어 한 컬럼에 저장하므로("강동구 천호동, 서초구 방배동"), 편집 시작 시 각 조각을 다시 토큰으로 복원한다
function parseRegionTokens(region: string | null | undefined): RegionToken[] {
  if (!region) return [];
  return region
    .split(",")
    .map((part) => parseRegionToken(part.trim()))
    .filter((token): token is RegionToken => token !== null);
}

// 태그 색 구분(MBTI/관심사/직접입력)을 위한 배경·글자색
function tagColors(variant: "mbti" | "custom" | "interest") {
  if (variant === "mbti") return { background: T.mbtiBg, color: T.mbtiText };
  if (variant === "custom") return { background: T.customBg, color: T.customText };
  return { background: T.accentSoft, color: T.accent };
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[12px] font-semibold tracking-wide mb-2.5" style={{ color: T.textMuted }}>
      {children}
    </p>
  );
}

function EmptyStateCard({ text, cta, onClick }: { text: string; cta: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border-2 border-dashed px-5 py-6 text-center transition-colors hover:bg-[#FDEDE2]"
      style={{ borderColor: T.hairline }}
    >
      <p className="text-[14px] mb-2" style={{ color: T.textMuted }}>
        {text}
      </p>
      <span className="inline-flex items-center gap-1 text-[13px] font-semibold" style={{ color: T.accent }}>
        {cta} <ChevronRight size={14} />
      </span>
    </button>
  );
}

function PillButton({
  children,
  onClick,
  disabled,
  variant = "primary",
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full px-4 py-1.5 text-[12px] font-semibold disabled:opacity-50 transition-opacity hover:opacity-90"
      style={
        variant === "primary"
          ? { background: T.accent, color: "#fff" }
          : { background: "transparent", color: T.textMuted, border: `1px solid ${T.hairline}` }
      }
    >
      {children}
    </button>
  );
}

function MyProfilePage() {
  const { user, token, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [hasSurvey, setHasSurvey] = useState<boolean | null>(null);
  const [editingTags, setEditingTags] = useState(false);
  const [draftTags, setDraftTags] = useState<string[]>([]);
  const [activeGroup, setActiveGroup] = useState<TagGroup | null>(null);
  const [customTagInput, setCustomTagInput] = useState("");
  const [tagsSaving, setTagsSaving] = useState(false);
  const [tagsError, setTagsError] = useState("");
  const [editingBio, setEditingBio] = useState(false);
  const [draftBio, setDraftBio] = useState("");
  const [bioSaving, setBioSaving] = useState(false);
  const [editingSmoking, setEditingSmoking] = useState(false);
  const [draftSmoking, setDraftSmoking] = useState("");
  const [draftSmokingType, setDraftSmokingType] = useState("");
  const [smokingSaving, setSmokingSaving] = useState(false);
  const [smokingError, setSmokingError] = useState("");
  const [editingRegion, setEditingRegion] = useState(false);
  const [draftRegionTokens, setDraftRegionTokens] = useState<RegionToken[]>([]);
  const [regionSaving, setRegionSaving] = useState(false);
  const [regionError, setRegionError] = useState("");
  const [profilePublic, setProfilePublic] = useState(true);
  const [bioError, setBioError] = useState("");
  const [editingNickname, setEditingNickname] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [draftCurrentPassword, setDraftCurrentPassword] = useState("");
  const [draftNewPassword, setDraftNewPassword] = useState("");
  const [draftNewPasswordConfirm, setDraftNewPasswordConfirm] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [withdrawPassword, setWithdrawPassword] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (!token) return;
    getMySurveys(token)
      .then((surveys) => setHasSurvey(surveys.length > 0))
      .catch(() => setHasSurvey(null));
  }, [token]);

  if (!user) return null;

  // 저장 순서 대신 그룹 정의 순서로 보여준다. 목록에 없는 직접 입력 태그는 맨 뒤로 보낸다
  const tagOrder = (tag: string) =>
    PROFILE_TAG_SET.has(tag) ? PROFILE_TAGS.indexOf(tag) : PROFILE_TAGS.length;
  const savedTags = [...user.tags].sort((a, b) => tagOrder(a) - tagOrder(b));

  const startEditTags = () => {
    setDraftTags(user.tags);
    setTagsError("");
    setActiveGroup(null);
    setCustomTagInput("");
    setEditingTags(true);
  };

  const draftMbti = draftTags.find((t) => MBTI_TAG_SET.has(t));
  const draftInterests = draftTags.filter((t) => !MBTI_TAG_SET.has(t));
  const draftCustom = draftInterests.find((t) => !PROFILE_TAG_SET.has(t));

  // MBTI/관심사/직접입력 태그를 색으로 구분해서 보여주기 위한 분류
  const tagVariant = (tag: string): "mbti" | "custom" | "interest" =>
    MBTI_TAG_SET.has(tag) ? "mbti" : PROFILE_TAG_SET.has(tag) ? "interest" : "custom";

  const pickMbti = (tag: string) => {
    if (!draftMbti && draftTags.length >= MAX_PROFILE_TAGS) {
      setTagsError(`태그는 최대 ${MAX_PROFILE_TAGS}개까지 넣을 수 있어요.`);
      return;
    }
    setDraftTags(tag === draftMbti ? draftInterests : [tag, ...draftInterests]);
    setTagsError("");
  };

  const toggleDraftTag = (tag: string) => {
    if (draftTags.includes(tag)) {
      setDraftTags(draftTags.filter((t) => t !== tag));
    } else if (draftTags.length >= MAX_PROFILE_TAGS) {
      setTagsError(`태그는 최대 ${MAX_PROFILE_TAGS}개까지 넣을 수 있어요.`);
      return;
    } else {
      setDraftTags([...draftTags, tag]);
    }
    setTagsError("");
  };

  const addCustomTag = () => {
    const tag = customTagInput.trim();
    if (!tag) return;
    // 태그는 서버에서 콤마로 이어 저장하므로 콤마가 들어가면 안 된다
    if (tag.includes(",")) {
      setTagsError("직접 입력 태그에는 콤마(,)를 쓸 수 없어요.");
      return;
    }
    if (PROFILE_TAG_SET.has(tag)) {
      setTagsError("이미 목록에 있는 태그예요. 위에서 골라주세요.");
      return;
    }
    if (MBTI_TAG_SET.has(tag.toUpperCase())) {
      setTagsError("MBTI는 위에서 골라주세요.");
      return;
    }
    if (!draftCustom && draftTags.length >= MAX_PROFILE_TAGS) {
      setTagsError(`태그는 최대 ${MAX_PROFILE_TAGS}개까지 넣을 수 있어요.`);
      return;
    }
    // 직접 입력 태그는 1개뿐이라 기존 것을 갈아끼운다
    setDraftTags([...draftTags.filter((t) => t !== draftCustom), tag]);
    setCustomTagInput("");
    setTagsError("");
  };

  const startEditBio = () => {
    setDraftBio(user.bio ?? "");
    setBioError("");
    setEditingBio(true);
  };

  const handleSaveBio = async () => {
    if (!token) return;
    setBioSaving(true);
    setBioError("");
    try {
      const updated = await updateBio(token, draftBio);
      setUser(updated);
      setEditingBio(false);
    } catch {
      setBioError("소개 저장에 실패했습니다.");
    } finally {
      setBioSaving(false);
    }
  };

  const handleSaveTags = async () => {
    if (!token) return;
    setTagsSaving(true);
    setTagsError("");
    try {
      const updated = await updateTags(token, draftTags);
      setUser(updated);
      setEditingTags(false);
    } catch (err) {
      setTagsError(extractErrorMessage(err, "태그 저장에 실패했습니다."));
    } finally {
      setTagsSaving(false);
    }
  };

  const startEditSmoking = () => {
    setDraftSmoking(user?.smoking ?? "");
    setDraftSmokingType(user?.smokingType ?? "");
    setSmokingError("");
    setEditingSmoking(true);
  };

  const handleSaveSmoking = async () => {
    if (!token) return;
    if (!draftSmoking) {
      setSmokingError("흡연 여부를 선택해주세요.");
      return;
    }
    if (draftSmoking === "SMOKER" && !draftSmokingType) {
      setSmokingError("흡연 종류를 선택해주세요.");
      return;
    }
    setSmokingSaving(true);
    setSmokingError("");
    try {
      const updated = await updateSmoking(token, draftSmoking, draftSmoking === "SMOKER" ? draftSmokingType : null);
      setUser(updated);
      setEditingSmoking(false);
    } catch (err) {
      setSmokingError(extractErrorMessage(err, "저장에 실패했습니다."));
    } finally {
      setSmokingSaving(false);
    }
  };

  const startEditRegion = () => {
    setDraftRegionTokens(parseRegionTokens(user.region));
    setRegionError("");
    setEditingRegion(true);
  };

  const handleSaveRegion = async () => {
    if (!token) return;
    if (draftRegionTokens.length === 0) {
      setRegionError("선호 지역을 선택해주세요.");
      return;
    }
    setRegionSaving(true);
    setRegionError("");
    try {
      const updated = await updateRegion(token, draftRegionTokens.map((t) => t.label).join(", "));
      setUser(updated);
      setEditingRegion(false);
    } catch (err) {
      setRegionError(extractErrorMessage(err, "지역 저장에 실패했습니다."));
    } finally {
      setRegionSaving(false);
    }
  };

  const startEditPassword = () => {
    setDraftCurrentPassword("");
    setDraftNewPassword("");
    setDraftNewPasswordConfirm("");
    setPasswordError("");
    setEditingPassword(true);
  };

  const handleSavePassword = async () => {
    if (!token) return;
    setPasswordError("");
    if (draftNewPassword !== draftNewPasswordConfirm) {
      setPasswordError("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    setPasswordSaving(true);
    try {
      const updated = await changePassword(token, draftCurrentPassword, draftNewPassword);
      setUser(updated);
      setEditingPassword(false);
    } catch (err) {
      setPasswordError(extractErrorMessage(err, "비밀번호 변경에 실패했습니다."));
    } finally {
      setPasswordSaving(false);
    }
  };

  const isSocialAccount = Boolean(user?.provider && user.provider !== "LOCAL");

  const handleConfirmWithdraw = async () => {
    if (!token) return;
    setWithdrawError("");
    if (!isSocialAccount && !withdrawPassword) {
      setWithdrawError("비밀번호를 입력해주세요.");
      return;
    }
    setWithdrawing(true);
    try {
      await withdraw(token, withdrawPassword);
      logout();
      navigate("/");
    } catch (err) {
      setWithdrawError(extractErrorMessage(err, "회원탈퇴에 실패했습니다."));
    } finally {
      setWithdrawing(false);
    }
  };

  const smokingLabel = formatSmokingLabel(user.smoking, user.smokingType);

  return (
    <div className="mypage-panel">
      <div
        className="profile-page relative w-full max-w-[980px] mx-auto rounded-[28px] px-7 py-8"
        style={{ background: T.card, boxShadow: "0 1px 3px rgba(36,28,21,0.06), 0 12px 32px rgba(36,28,21,0.06)" }}
      >
        <div className="max-w-[420px] mx-auto">

        {hasSurvey === false && (
          <Link
            to="/survey"
            className="mb-6 flex items-center gap-3 rounded-2xl px-4 py-3.5 no-underline transition-transform hover:scale-[1.02]"
            style={{
              background: `linear-gradient(135deg, ${T.accent}, #FFAA66)`,
              boxShadow: "0 8px 20px rgba(242,121,58,0.35)",
            }}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/25">
              <Sparkles size={18} color="#fff" strokeWidth={2.2} />
            </span>
            <span className="flex-1">
              <p className="text-[13px] font-bold text-white leading-snug">설문조사를 아직 안 하셨어요!</p>
              <p className="text-[12px] text-white/85 leading-snug">완료하면 매칭이 시작돼요</p>
            </span>
            <ChevronRight size={18} color="#fff" strokeWidth={2.4} className="shrink-0" />
          </Link>
        )}

        {/* ---------- 헤더: 아바타 + 이름 + 기본정보 ---------- */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-3">
            <img
              className="w-24 h-24 rounded-full object-cover border-2"
              style={{ borderColor: T.accent }}
              src={user.profileImageUrl ? `${API_ORIGIN}${user.profileImageUrl}` : defaultAvatar}
              alt={user.nickname}
            />
            <Link
              to="/mypage/edit"
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center border-2"
              style={{ background: T.accent, borderColor: T.card }}
              aria-label="프로필 이미지 편집"
            >
              <Camera size={14} color="#fff" strokeWidth={2.2} />
            </Link>
          </div>

          <div className="flex items-center gap-1.5 mb-0.5">
            <div className="relative">
              {user.emailVerified && (
                <span
                  title="이메일 인증 완료"
                  aria-label="이메일 인증 완료"
                  className="absolute -left-7 top-1/2 -translate-y-1/2"
                >
                  {/* 방패 테두리와 체크 표시의 두께를 다르게 주기 위해 lucide ShieldCheck를 커스텀 svg로 대체 */}
                  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path
                      d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
                      fill={T.accent}
                      stroke="#fff"
                      strokeWidth={2.2}
                    />
                    <path d="m9 12 2 2 4-4" stroke="#fff" strokeWidth={1.4} />
                  </svg>
                </span>
              )}
              <h1 className="text-[30px] font-bold m-1" style={{ color: T.textPrimary }}>
                {user.nickname}
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setEditingNickname(true)}
              className="opacity-70 hover:opacity-100"
              style={{ color: T.textMuted }}
              aria-label="닉네임 편집"
            >
              <Pencil size={15} />
            </button>
          </div>

          {editingNickname && token && (
            <NicknameModal
              currentNickname={user.nickname}
              token={token}
              onClose={() => setEditingNickname(false)}
              onSuccess={setUser}
            />
          )}

          <p className="text-[13px] font-medium mb-1" style={{ color: T.textPrimary }}>
            {[`${getAge(user.birthDate)}세`, GENDER_LABEL[user.gender] ?? user.gender, user.job].filter(Boolean).join(" · ")}
          </p>

          {/* 흡연 여부 + 선호 지역 — 칩을 클릭하면 바로 편집 모드로 전환 */}
          <div className="flex flex-wrap items-center justify-center gap-2">
          {!editingSmoking ? (
            <button
              type="button"
              onClick={startEditSmoking}
              aria-label="흡연여부 편집"
              className="inline-flex items-center rounded-full px-3 py-1.5 text-[13px] font-medium bg-[#FDEDE2] text-[#F2793A] transition-colors hover:bg-[#F2793A] hover:text-white"
            >
              {smokingLabel ?? "흡연 여부를 설정해주세요"}
            </button>
          ) : (
            <div className="w-full max-w-[280px] text-left flex flex-col gap-2">
              <select
                className="w-full rounded-xl border px-3 py-2 text-[13px]"
                style={{ borderColor: T.hairline, color: T.textPrimary }}
                value={draftSmoking}
                onChange={(e) => {
                  setDraftSmoking(e.target.value);
                  if (e.target.value !== "SMOKER") setDraftSmokingType("");
                }}
              >
                <option value="" disabled>선택해주세요</option>
                <option value="NON_SMOKER">비흡연자</option>
                <option value="SMOKER">흡연자</option>
              </select>
              {draftSmoking === "SMOKER" && (
                <select
                  className="w-full rounded-xl border px-3 py-2 text-[13px]"
                  style={{ borderColor: T.hairline, color: T.textPrimary }}
                  value={draftSmokingType}
                  onChange={(e) => setDraftSmokingType(e.target.value)}
                >
                  <option value="" disabled>흡연 종류 선택</option>
                  <option value="CIGARETTE">연초</option>
                  <option value="HEATED">궐련형</option>
                  <option value="LIQUID">액상</option>
                </select>
              )}
              {smokingError && <p className="text-[12px]" style={{ color: T.danger }}>{smokingError}</p>}
              <div className="flex gap-2">
                <PillButton onClick={handleSaveSmoking} disabled={smokingSaving}>
                  {smokingSaving ? "저장 중..." : "저장"}
                </PillButton>
                <PillButton variant="ghost" onClick={() => setEditingSmoking(false)} disabled={smokingSaving}>
                  취소
                </PillButton>
              </div>
            </div>
          )}

          {/* 선호 지역 — 칩을 클릭하면 바로 편집 모드로 전환 */}
          {!editingRegion ? (
            <button
              type="button"
              onClick={startEditRegion}
              aria-label="선호 지역 편집"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium bg-[#EEF1FB] text-[#4A5A9E] transition-colors hover:bg-[#4A5A9E] hover:text-white"
            >
              <MapPin size={14} strokeWidth={2.2} />
              {user.region ?? "선호 지역을 설정해주세요"}
            </button>
          ) : (
            <div className="w-full max-w-[280px] text-left flex flex-col gap-2">
              <RegionPicker
                selected={draftRegionTokens}
                onChange={setDraftRegionTokens}
                multiple
                maxSelect={3}
                variant="inline"
                placeholder="지역명 검색 예) 강남, 역삼동, 강남구 역삼동"
                emptyHint="선호 지역을 최대 3개까지 선택해주세요."
              />
              {regionError && <p className="text-[12px]" style={{ color: T.danger }}>{regionError}</p>}
              <div className="flex gap-2">
                <PillButton onClick={handleSaveRegion} disabled={regionSaving}>
                  {regionSaving ? "저장 중..." : "저장"}
                </PillButton>
                <PillButton variant="ghost" onClick={() => setEditingRegion(false)} disabled={regionSaving}>
                  취소
                </PillButton>
              </div>
            </div>
          )}
          </div>
        </div>

        <div className="h-px my-7" style={{ background: T.hairline }} />

        {/* ---------- 자기소개 ---------- */}
        <div className="mb-7 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-2.5">
            <SectionLabel>자기소개</SectionLabel>
            {user.bio && !editingBio && (
              <button type="button" onClick={startEditBio} className="opacity-40 hover:opacity-80" aria-label="소개 편집">
                <Pencil size={13} />
              </button>
            )}
          </div>

          {editingBio ? (
            <div>
              <textarea
                autoFocus
                value={draftBio}
                onChange={(e) => setDraftBio(e.target.value.slice(0, MAX_BIO_LENGTH))}
                maxLength={MAX_BIO_LENGTH}
                placeholder="자기소개를 적어주세요"
                rows={3}
                className="w-full rounded-2xl px-4 py-3 text-[14px] outline-none border resize-none"
                style={{ borderColor: T.accent, color: T.textPrimary }}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[12px]" style={{ color: T.textMuted }}>
                  {draftBio.length} / {MAX_BIO_LENGTH}
                </span>
                <div className="flex gap-2">
                  {bioError && <p className="text-[12px] self-center" style={{ color: T.danger }}>{bioError}</p>}
                  <PillButton onClick={handleSaveBio} disabled={bioSaving}>
                    {bioSaving ? "저장 중..." : "저장"}
                  </PillButton>
                  <PillButton variant="ghost" onClick={() => setEditingBio(false)} disabled={bioSaving}>
                    취소
                  </PillButton>
                </div>
              </div>
            </div>
          ) : user.bio ? (
            <p className="text-[14px] leading-relaxed text-center rounded-2xl px-4 py-3.5" style={{ background: "#FAF6EF", color: T.textPrimary }}>
              {user.bio}
            </p>
          ) : (
            <EmptyStateCard text="아직 소개를 작성하지 않았어요" cta="자기소개 작성하기" onClick={startEditBio} />
          )}
        </div>

        {/* ---------- 태그 ---------- */}
        <div className="mb-7 text-center">
          <SectionLabel>내 태그</SectionLabel>

          {!editingTags ? (
            savedTags.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-1.5">
                {savedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full px-3 py-1.5 text-[13px] font-medium"
                    style={tagColors(tagVariant(tag))}
                  >
                    {tag}
                  </span>
                ))}
                <button
                  type="button"
                  onClick={startEditTags}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-medium border border-dashed transition-colors hover:bg-[#FDEDE2]"
                  style={{ borderColor: T.textMuted, color: T.textMuted }}
                >
                  <Pencil size={12} /> 편집
                </button>
              </div>
            ) : (
              <EmptyStateCard text="아직 등록한 태그가 없어요" cta="태그 추가하기" onClick={startEditTags} />
            )
          ) : (
            <div className="flex flex-col gap-3 text-left">
              <p className="text-[12px]" style={{ color: T.textMuted }}>
                태그를 최대 {MAX_PROFILE_TAGS}개까지 넣을 수 있어요.
                <span className="ml-1 font-semibold" style={{ color: T.accent }}>
                  ({draftTags.length}/{MAX_PROFILE_TAGS})
                </span>
              </p>

              <div>
                <p className="text-[12px] font-bold mb-1.5" style={{ color: T.textMuted }}>MBTI</p>
                <div className="flex flex-wrap gap-1">
                  {MBTI_TAGS.map((tag) => {
                    const selected = draftMbti === tag;
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => pickMbti(tag)}
                        className="rounded-full px-2 py-1 text-[12px] font-medium border min-w-[52px]"
                        style={
                          selected
                            ? { background: T.mbtiBg, borderColor: T.mbtiText, color: T.mbtiText }
                            : { background: "#F7F7F7", borderColor: T.hairline, color: T.textMuted }
                        }
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-[12px] font-bold mb-1.5" style={{ color: T.textMuted }}>관심사</p>
                <div className="flex flex-wrap gap-1.5">
                  {PROFILE_TAG_GROUPS.map((group) => {
                    const picked = group.tags.filter((t) => draftTags.includes(t)).length;
                    const active = activeGroup === group;
                    return (
                      <button
                        type="button"
                        key={group.label}
                        onClick={() => setActiveGroup(active ? null : group)}
                        className="rounded-full px-3 py-1.5 text-[13px] font-medium border"
                        style={
                          active
                            ? { background: T.accentSoft, borderColor: T.accent, color: T.accent }
                            : { background: "#F7F7F7", borderColor: T.hairline, color: T.textMuted }
                        }
                      >
                        {group.label}
                        {picked > 0 && <span className="ml-1 font-bold" style={{ color: "#16a34a" }}>✓ {picked}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {activeGroup && (
                <div className="flex flex-wrap gap-1.5 rounded-2xl p-2.5" style={{ background: "#FAF6EF" }}>
                  {activeGroup.tags.map((tag) => {
                    const selected = draftTags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => toggleDraftTag(tag)}
                        className="rounded-full px-3 py-1.5 text-[13px] font-medium border"
                        style={
                          selected
                            ? { background: T.accentSoft, borderColor: T.accent, color: T.accent }
                            : { background: "#fff", borderColor: T.hairline, color: T.textMuted }
                        }
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              )}

              <div>
                <p className="text-[12px] font-bold mb-1.5" style={{ color: T.textMuted }}>직접 입력</p>
                <div className="flex gap-1.5">
                  <input
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomTag();
                      }
                    }}
                    maxLength={MAX_CUSTOM_TAG_LENGTH}
                    placeholder={draftCustom ?? `나만의 태그 (${MAX_CUSTOM_TAG_LENGTH}자 이내)`}
                    className="flex-1 min-w-0 rounded-full px-3 py-1.5 text-[13px] border outline-none"
                    style={{ borderColor: T.hairline, color: T.textPrimary }}
                  />
                  <button
                    type="button"
                    onClick={addCustomTag}
                    disabled={!customTagInput.trim()}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-medium border border-dashed disabled:opacity-50"
                    style={{ borderColor: T.textMuted, color: T.textMuted }}
                  >
                    <Plus size={12} /> {draftCustom ? "변경" : "추가"}
                  </button>
                </div>
              </div>

              {draftTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t" style={{ borderColor: T.hairline }}>
                  {draftTags.map((tag) => {
                    const variant = tagVariant(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => setDraftTags(draftTags.filter((t) => t !== tag))}
                        className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-medium"
                        style={tagColors(variant)}
                      >
                        {tag}
                        <X size={12} />
                      </button>
                    );
                  })}
                </div>
              )}

              {tagsError && <p className="text-[12px]" style={{ color: T.danger }}>{tagsError}</p>}

              <div className="flex gap-2">
                <PillButton onClick={handleSaveTags} disabled={tagsSaving}>
                  {tagsSaving ? "저장 중..." : "저장"}
                </PillButton>
                <PillButton
                  variant="ghost"
                  onClick={() => {
                    setDraftTags([]);
                    setTagsError("");
                  }}
                  disabled={tagsSaving || draftTags.length === 0}
                >
                  초기화
                </PillButton>
                <PillButton variant="ghost" onClick={() => setEditingTags(false)} disabled={tagsSaving}>
                  취소
                </PillButton>
              </div>
            </div>
          )}
        </div>

        <div className="h-px mb-6" style={{ background: T.hairline }} />

        {/* ---------- 비밀번호 관리 ---------- */}
        {!editingPassword ? (
          <button
            type="button"
            onClick={startEditPassword}
            className="w-full rounded-full py-2 text-[15px] font-bold mb-6 transition-opacity hover:opacity-80"
            style={{ background: T.accent, color: "#fff" }}
          >
            비밀번호 관리
          </button>
        ) : (
          <div className="mb-5 flex flex-col gap-2 text-left">
            <input
              type="password"
              placeholder="현재 비밀번호"
              value={draftCurrentPassword}
              onChange={(e) => setDraftCurrentPassword(e.target.value)}
              className="w-full rounded-xl border px-3 py-2.5 text-[14px] outline-none"
              style={{ borderColor: T.hairline, color: T.textPrimary }}
            />
            <input
              type="password"
              placeholder="새 비밀번호"
              value={draftNewPassword}
              onChange={(e) => setDraftNewPassword(e.target.value)}
              className="w-full rounded-xl border px-3 py-2.5 text-[14px] outline-none"
              style={{ borderColor: T.hairline, color: T.textPrimary }}
            />
            <input
              type="password"
              placeholder="새 비밀번호 확인"
              value={draftNewPasswordConfirm}
              onChange={(e) => setDraftNewPasswordConfirm(e.target.value)}
              className="w-full rounded-xl border px-3 py-2.5 text-[14px] outline-none"
              style={{ borderColor: T.hairline, color: T.textPrimary }}
            />
            {passwordError && <p className="text-[12px]" style={{ color: T.danger }}>{passwordError}</p>}
            <div className="flex gap-2">
              <PillButton onClick={handleSavePassword} disabled={passwordSaving}>
                {passwordSaving ? "저장 중..." : "저장"}
              </PillButton>
              <PillButton variant="ghost" onClick={() => setEditingPassword(false)} disabled={passwordSaving}>
                취소
              </PillButton>
            </div>
          </div>
        )}

        {/* ---------- 계정 정보 ---------- */}
        <div className="rounded-2xl px-4 py-1" style={{ background: "#FAF6EF" }}>
          {(
            [
              ["가입일", new Date(user.createdAt).toLocaleDateString("ko-KR")],
              ["이메일", user.email],
              ["소셜 로그인", !user.provider || user.provider === "LOCAL" ? "소셜 비연동" : user.provider],
            ] as const
          ).map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between py-3"
              style={{ borderBottom: `1px solid ${T.hairline}` }}
            >
              <span className="text-[13px]" style={{ color: T.textMuted }}>{label}</span>
              <span className="text-[13px] font-medium" style={{ color: T.textPrimary }}>{value}</span>
            </div>
          ))}

          <div className="flex items-center justify-between py-3">
            <span className="text-[13px]" style={{ color: T.textMuted }}>프로필 공개</span>
            <button
              type="button"
              role="switch"
              aria-checked={profilePublic}
              aria-label="프로필 공개 여부"
              onClick={() => setProfilePublic((prev) => !prev)}
              className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
              style={{ background: profilePublic ? T.accent : T.hairline }}
            >
              <span
                className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform"
                style={{ transform: profilePublic ? "translateX(22px)" : "translateX(0)" }}
              />
            </button>
          </div>
        </div>

        {/* ---------- 회원탈퇴 ---------- */}
        {!showWithdrawConfirm ? (
          <div className="flex justify-end mt-5">
            <button
              type="button"
              onClick={() => {
                setShowWithdrawConfirm(true);
                setWithdrawError("");
                setWithdrawPassword("");
              }}
              className="inline-flex items-center gap-1 text-[12px] hover:underline"
              style={{ color: T.textMuted }}
            >
              <LogOut size={11} />
              회원탈퇴
            </button>
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-2 text-left">
            <p className="text-[13px] font-semibold" style={{ color: T.textPrimary }}>
              정말 탈퇴하시겠어요? 이 작업은 되돌릴 수 없어요.
            </p>
            {!isSocialAccount && (
              <input
                type="password"
                placeholder="비밀번호 확인"
                value={withdrawPassword}
                onChange={(e) => setWithdrawPassword(e.target.value)}
                className="w-full rounded-xl border px-3 py-2.5 text-[14px] outline-none"
                style={{ borderColor: T.hairline, color: T.textPrimary }}
              />
            )}
            {withdrawError && <p className="text-[12px]" style={{ color: T.danger }}>{withdrawError}</p>}
            <div className="flex justify-end gap-2">
              <PillButton variant="ghost" onClick={() => setShowWithdrawConfirm(false)} disabled={withdrawing}>
                취소
              </PillButton>
              <button
                type="button"
                onClick={handleConfirmWithdraw}
                disabled={withdrawing}
                className="rounded-full px-4 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
                style={{ background: T.danger }}
              >
                {withdrawing ? "처리 중..." : "탈퇴하기"}
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

export default MyProfilePage;
