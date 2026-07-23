import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { uploadProfileImage, deleteProfileImage, API_ORIGIN } from "../../api";
import defaultAvatar from "../../assets/Roomie_logo.png";
import "./MyPageContent.css";

function EditProfilePage() {
  const { user, token, setUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  if (!user) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !token) return;

    setUploading(true);
    setError("");
    try {
      const updated = await uploadProfileImage(token, file);
      setUser(updated);
    } catch {
      setError("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!token) return;
    setDeleting(true);
    setError("");
    try {
      const updated = await deleteProfileImage(token);
      setUser(updated);
    } catch {
      setError("이미지 삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mypage-panel edit-profile-panel">
      <h1 className="mypage-panel-title">프로필 편집</h1>

      <div className="edit-photo-card">
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

        {error && <p className="mypage-error">{error}</p>}

        <ul className="edit-photo-rules">
          <li>jpg, png, webp 형식의 파일만 업로드할 수 있어요.</li>
          <li>파일 크기는 5MB를 넘을 수 없어요.</li>
        </ul>
      </div>

      <Link to="/mypage" className="btn btn-outline">
        완료
      </Link>
    </div>
  );
}

export default EditProfilePage;
