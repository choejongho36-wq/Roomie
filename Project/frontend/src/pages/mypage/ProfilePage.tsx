import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { uploadProfileImage, deleteProfileImage, updateTags, getMySurveys, API_ORIGIN } from "../../api";
import { PROFILE_TAGS, MAX_PROFILE_TAGS } from "../../data/ProfileTags";
import defaultAvatar from "../../assets/Roomie_logo.png";
import "./MyPageContent.css";

const GENDER_LABEL: Record<string, string> = { M: "남성", F: "여성" };

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

function ProfilePage() {
  const { user, token, setUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [hasSurvey, setHasSurvey] = useState<boolean | null>(null);
  const [editingTags, setEditingTags] = useState(false);
  const [draftTags, setDraftTags] = useState<string[]>([]);
  const [tagsSaving, setTagsSaving] = useState(false);
  const [tagsError, setTagsError] = useState("");

  useEffect(() => {
    if (!token) return;
    getMySurveys(token)
      .then((surveys) => setHasSurvey(surveys.length > 0))
      .catch(() => setHasSurvey(null));
  }, [token]);

  if (!user) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !token) return;

    setUploading(true);
    setUploadError("");
    try {
      const updated = await uploadProfileImage(token, file);
      setUser(updated);
    } catch {
      setUploadError("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

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

  const handleDelete = async () => {
    if (!token) return;
    setDeleting(true);
    setUploadError("");
    try {
      const updated = await deleteProfileImage(token);
      setUser(updated);
    } catch {
      setUploadError("이미지 삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
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

      <div className="profile-card">
        <div className="profile-card-main">
          <div className="mypage-avatar-wrap">
            <img
              className="mypage-avatar-img"
              src={user.profileImageUrl ? `${API_ORIGIN}${user.profileImageUrl}` : defaultAvatar}
              alt={user.nickname}
            />
            <div className="mypage-avatar-actions">
              <button
                type="button"
                className="mypage-avatar-btn mypage-avatar-btn-change"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || deleting}
              >
                {uploading ? "업로드 중..." : "사진 변경"}
              </button>
              <button
                type="button"
                className="mypage-avatar-btn mypage-avatar-btn-delete"
                onClick={handleDelete}
                disabled={!user.profileImageUrl || uploading || deleting}
              >
                {deleting ? "삭제 중..." : "사진 삭제"}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="mypage-avatar-input"
              onChange={handleFileChange}
            />
          </div>
          <div>
            <h2>{user.nickname}</h2>
            <p className="profile-card-meta">
              {getAge(user.birthDate)}세 · {GENDER_LABEL[user.gender] ?? user.gender}
            </p>
            {uploadError && <p className="mypage-error">{uploadError}</p>}

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
          </div>
        </div>

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
      </div>
    </div>
  );
}

export default ProfilePage;
