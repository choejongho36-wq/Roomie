import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { updateNickname } from "../../api";
import type { User } from "../../types";
import "../../components/LoginModal.css";

const MAX_NICKNAME_LENGTH = 30;

interface NicknameModalProps {
  currentNickname: string;
  token: string;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

function NicknameModal({ currentNickname, token, onClose, onSuccess }: NicknameModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [nickname, setNickname] = useState(currentNickname);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleConfirm = async () => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      setError("닉네임을 입력해주세요.");
      return;
    }
    if (!confirm(`"${trimmed}"(으)로 닉네임을 변경할까요? 변경 후 3개월간 다시 바꿀 수 없어요.`)) {
      return;
    }

    setSaving(true);
    setError("");
    try {
      const updated = await updateNickname(token, trimmed);
      onSuccess(updated);
      onClose();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && typeof err.response?.data === "string"
          ? err.response.data
          : "닉네임 저장에 실패했습니다.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <dialog ref={dialogRef} className="login-modal" onClose={onClose}>
      <div className="login-modal-form">
        <button type="button" className="login-modal-close" onClick={onClose} aria-label="닫기">
          ×
        </button>
        <h2>닉네임 변경</h2>
        <input
          className="profile-nickname-input"
          value={nickname}
          onChange={(e) => setNickname(e.target.value.slice(0, MAX_NICKNAME_LENGTH))}
          maxLength={MAX_NICKNAME_LENGTH}
          autoFocus
        />
        <p className="profile-nickname-warning">닉네임은 3개월에 한 번만 변경할 수 있어요.</p>
        {error && <p className="login-modal-error">{error}</p>}
        <button type="button" className="btn btn-primary" onClick={handleConfirm} disabled={saving}>
          {saving ? "확인 중..." : "확인"}
        </button>
      </div>
    </dialog>
  );
}

export default NicknameModal;
