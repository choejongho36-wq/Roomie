import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { updateTags, updateBio, changePassword, getMySurveys, API_ORIGIN } from "../../api";
import { PROFILE_TAGS, MAX_PROFILE_TAGS } from "../../data/ProfileTags";
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


  const startEditTags = () => {
    setDraftTags(user.tags);
    setTagsError("");
    setEditingTags(true);
  };

  const toggleDraftTag = (tag: string) => {
    setDraftTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= MAX_PROFILE_TAGS) return prev;
      return [...prev, tag];
    });
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
    } catch {
      setTagsError("태그 저장에 실패했습니다.");
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
      {hasSurvey === false && (
        <div className="mypage-notice">
          <span>설문조사를 안했어요!!</span>
          <Link to="/survey" className="btn btn-primary">
            설문 시작하기
          </Link>
        </div>
      )}

      <div className="profile-card profile-card-vertical">
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
              <div className="profile-tags">
                {user.tags.map((tag) => (
                  <span key={tag} className="profile-tag">
                    {tag}
                  </span>
                ))}
                <button type="button" className="profile-tags-edit" onClick={startEditTags}>
                  태그 편집
                </button>
              </div>
            ) : (
              <div className="profile-tags-editor">
                <div className="profile-tags">
                  {PROFILE_TAGS.map((tag) => (
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
        </div>

        <button type="button" className="profile-withdraw-btn" onClick={handleWithdraw}>
          회원탈퇴
        </button>
      </div>
    </div>
  );
}

export default ProfilePage;
