import { useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { uploadProfileImage, deleteProfileImage, API_ORIGIN } from "../../api";
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
