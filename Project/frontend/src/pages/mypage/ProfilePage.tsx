import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { updateTags, updateBio, changePassword, getMySurveys, API_ORIGIN } from "../../api";
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
import "./MyPageContent.css";

const GENDER_LABEL: Record<string, string> = { M: "남성", F: "여성" };
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

function ProfilePage() {
  const { user, token, setUser } = useAuth();
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
  const [bioError, setBioError] = useState("");
  const [editingNickname, setEditingNickname] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [draftCurrentPassword, setDraftCurrentPassword] = useState("");
  const [draftNewPassword, setDraftNewPassword] = useState("");
  const [draftNewPasswordConfirm, setDraftNewPasswordConfirm] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");

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
  // 목록에서 고른 태그와 직접 입력 태그는 상한을 따로 센다
  const draftPicked = draftInterests.filter((t) => PROFILE_TAG_SET.has(t));
  const draftCustom = draftInterests.find((t) => !PROFILE_TAG_SET.has(t));

  const pickMbti = (tag: string) => {
    setDraftTags(tag === draftMbti ? draftInterests : [tag, ...draftInterests]);
    setTagsError("");
  };

  const toggleDraftTag = (tag: string) => {
    if (draftTags.includes(tag)) {
      setDraftTags(draftTags.filter((t) => t !== tag));
    } else if (draftPicked.length >= MAX_PROFILE_TAGS) {
      setTagsError(`관심사 태그는 최대 ${MAX_PROFILE_TAGS}개까지 선택할 수 있어요.`);
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

  const handleWithdraw = () => {
    alert("준비 중인 기능이에요.");
  };


  return (
    <div className="mypage-panel">
      <div className="profile-card profile-card-vertical">
        {hasSurvey === false && (
          <Link to="/survey" className="profile-survey-alert">
            설문조사를 아직 안 하셨어요!
            <br />
            완료하면 매칭이 시작돼요.
          </Link>
        )}
        <img
          className="mypage-avatar-img mypage-avatar-img-lg"
          src={user.profileImageUrl ? `${API_ORIGIN}${user.profileImageUrl}` : defaultAvatar}
          alt={user.nickname}
        />
        <Link to="/mypage/edit" className="profile-edit-btn">
          프로필 편집
        </Link>

        <div className="profile-nickname-row">
          <h2>{user.nickname}</h2>
          {user.emailVerified && (
            <span className="verified-badge" title="이메일 인증 완료" aria-label="이메일 인증 완료">
              <svg width="16" height="18" viewBox="0 0 18 20" fill="none" aria-hidden="true">
                <path
                  d="M9 1l7 2.6v5.2c0 5-3 8.4-7 10.2-4-1.8-7-5.2-7-10.2V3.6L9 1z"
                  fill="currentColor"
                />
                <path
                  d="M5.8 9.6l2.3 2.3L12.4 7"
                  stroke="#fff"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          )}
          <button
            type="button"
            className="profile-inline-edit-btn"
            onClick={() => setEditingNickname(true)}
            aria-label="닉네임 편집"
          >
            편집
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

        <p className="profile-card-meta">
          {getAge(user.birthDate)}세 · {GENDER_LABEL[user.gender] ?? user.gender}
        </p>

        <div className="profile-bio-box">
          {!editingBio ? (
            <>
              <p className="profile-bio-text">
                {user.bio ? `"${user.bio}"` : "아직 소개를 작성하지 않았어요."}
              </p>
              <button
                type="button"
                className="profile-box-edit-btn"
                onClick={startEditBio}
                aria-label="소개 편집"
              >
                편집
              </button>
            </>
          ) : (
            <div className="profile-bio-editor">
              <textarea
                className="profile-bio-textarea"
                value={draftBio}
                onChange={(e) => setDraftBio(e.target.value.slice(0, MAX_BIO_LENGTH))}
                maxLength={MAX_BIO_LENGTH}
                placeholder="나를 소개하는 한마디를 남겨보세요."
                rows={3}
              />
              <span className="profile-bio-count">
                {draftBio.length} / {MAX_BIO_LENGTH}
              </span>
              {bioError && <p className="mypage-error">{bioError}</p>}
              <div className="profile-tags-actions">
                <button
                  type="button"
                  className="mypage-avatar-btn mypage-avatar-btn-change"
                  onClick={handleSaveBio}
                  disabled={bioSaving}
                >
                  {bioSaving ? "저장 중..." : "저장"}
                </button>
                <button
                  type="button"
                  className="mypage-avatar-btn mypage-avatar-btn-delete"
                  onClick={() => setEditingBio(false)}
                  disabled={bioSaving}
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>

            {!editingTags ? (
              <div className="profile-tags-view">
                {savedTags.length > 0 && (
                  <div className="profile-tags">
                    {savedTags.map((tag) => (
                      <span key={tag} className="profile-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <button type="button" className="profile-tags-edit" onClick={startEditTags}>
                  태그 편집
                </button>
              </div>
            ) : (
              <div className="profile-tags-editor">
                <p className="profile-tag-hint">
                  MBTI 1개와 관심사 태그 최대 {MAX_PROFILE_TAGS}개, 직접 입력 태그 1개를 넣을 수 있어요.
                  <span className="profile-tag-hint-count">
                    ({draftPicked.length}/{MAX_PROFILE_TAGS})
                  </span>
                </p>

                <p className="profile-tag-group-title">MBTI</p>
                <div className="profile-tag-row profile-tag-row-mbti">
                  {MBTI_TAGS.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      className={`profile-tag profile-tag-selectable${
                        draftMbti === tag ? " profile-tag-selected" : ""
                      }`}
                      onClick={() => pickMbti(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <p className="profile-tag-group-title">관심사</p>
                <div className="profile-tag-row">
                  {PROFILE_TAG_GROUPS.map((group) => {
                    const picked = group.tags.filter((t) => draftTags.includes(t)).length;
                    return (
                      <button
                        type="button"
                        key={group.label}
                        className={`profile-tag profile-tag-selectable profile-tag-group-btn${
                          activeGroup === group ? " profile-tag-selected" : ""
                        }`}
                        onClick={() => setActiveGroup(activeGroup === group ? null : group)}
                      >
                        {group.label}
                        {picked > 0 && <span className="profile-tag-check">✓ {picked}</span>}
                      </button>
                    );
                  })}
                </div>

                {activeGroup && (
                  <div className="profile-tag-row profile-tag-row-options">
                    {activeGroup.tags.map((tag) => (
                      <button
                        type="button"
                        key={tag}
                        className={`profile-tag profile-tag-selectable${
                          draftTags.includes(tag) ? " profile-tag-selected" : ""
                        }`}
                        onClick={() => toggleDraftTag(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}

                <p className="profile-tag-group-title">직접 입력</p>
                <div className="profile-tag-custom">
                  <input
                    className="profile-tag-custom-input"
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
                  />
                  <button
                    type="button"
                    className="profile-tag profile-tag-selectable"
                    onClick={addCustomTag}
                    disabled={!customTagInput.trim()}
                  >
                    {draftCustom ? "변경" : "추가"}
                  </button>
                </div>

                {draftTags.length > 0 && (
                  <div className="profile-tag-row profile-tag-row-picked">
                    {draftTags.map((tag) => (
                      <button
                        type="button"
                        key={tag}
                        className="profile-tag profile-tag-selected"
                        onClick={() => setDraftTags(draftTags.filter((t) => t !== tag))}
                      >
                        {tag} ×
                      </button>
                    ))}
                  </div>
                )}
                {tagsError && <p className="mypage-error">{tagsError}</p>}
                <div className="profile-tags-actions">
                  <button
                    type="button"
                    className="mypage-avatar-btn mypage-avatar-btn-change"
                    onClick={handleSaveTags}
                    disabled={tagsSaving}
                  >
                    {tagsSaving ? "저장 중..." : "저장"}
                  </button>
                  <button
                    type="button"
                    className="mypage-avatar-btn mypage-avatar-btn-delete"
                    onClick={() => {
                      setDraftTags([]);
                      setTagsError("");
                    }}
                    disabled={tagsSaving || draftTags.length === 0}
                  >
                    초기화
                  </button>
                  <button
                    type="button"
                    className="mypage-avatar-btn mypage-avatar-btn-delete"
                    onClick={() => setEditingTags(false)}
                    disabled={tagsSaving}
                  >
                    취소
                  </button>
                </div>
              </div>
            )}

        {!editingPassword ? (
          <button type="button" className="btn btn-outline profile-password-manage-btn" onClick={startEditPassword}>
            비밀번호 관리
          </button>
        ) : (
          <div className="profile-password-box">
            <div className="profile-bio-editor">
              <input
                type="password"
                className="profile-nickname-input"
                placeholder="현재 비밀번호"
                value={draftCurrentPassword}
                onChange={(e) => setDraftCurrentPassword(e.target.value)}
              />
              <input
                type="password"
                className="profile-nickname-input"
                placeholder="새 비밀번호"
                value={draftNewPassword}
                onChange={(e) => setDraftNewPassword(e.target.value)}
              />
              <input
                type="password"
                className="profile-nickname-input"
                placeholder="새 비밀번호 확인"
                value={draftNewPasswordConfirm}
                onChange={(e) => setDraftNewPasswordConfirm(e.target.value)}
              />
              {passwordError && <p className="mypage-error">{passwordError}</p>}
              <div className="profile-tags-actions">
                <button
                  type="button"
                  className="mypage-avatar-btn mypage-avatar-btn-change"
                  onClick={handleSavePassword}
                  disabled={passwordSaving}
                >
                  {passwordSaving ? "저장 중..." : "저장"}
                </button>
                <button
                  type="button"
                  className="mypage-avatar-btn mypage-avatar-btn-delete"
                  onClick={() => setEditingPassword(false)}
                  disabled={passwordSaving}
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

          <div className="profile-card-info">
          <div className="profile-card-info-row">
            <span>가입일</span>
            <span>{new Date(user.createdAt).toLocaleDateString("ko-KR")}</span>
          </div>
          <div className="profile-card-info-row">
            <span>이메일</span>
            <span>{user.email}</span>
          </div>
          <div className="profile-card-info-row">
            <span>소셜 로그인</span>
            <span>{!user.provider || user.provider === "LOCAL" ? "소셜 비연동" : user.provider}</span>
          </div>
        </div>

        <button type="button" className="profile-withdraw-btn" onClick={handleWithdraw}>
          회원탈퇴
        </button>
      </div>
    </div>
  );
}

export default ProfilePage;
