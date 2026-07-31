import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { login, API_ORIGIN } from "../api";
import logo from "../assets/Roomie_logo.png";
import "./LoginModal.css";

interface LoginModalProps {
  onClose: () => void;
  onLoginSuccess: (token: string) => void;
}

function LoginModal({ onClose, onLoginSuccess }: LoginModalProps) {
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const token = await login(loginId, password);
      onLoginSuccess(token);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && typeof err.response?.data === "string"
          ? err.response.data
          : "로그인에 실패했습니다.";
      setError(message);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="login-modal"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="login-modal-form">
        <button type="button" className="login-modal-close" onClick={onClose} aria-label="닫기">
          ×
        </button>
        <div className="login-modal-brand">
          <img src={logo} alt="Roomie" className="login-modal-logo" />
          <span className="login-modal-brand-text">Roomie</span>
        </div>
        <input
          type="text"
          placeholder="아이디"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="login-modal-error">{error}</p>}
        <button type="submit">로그인</button>

        <p className="login-modal-recovery-links">
          <button
            type="button"
            className="login-modal-link"
            onClick={() => {
              onClose();
              navigate("/find-id");
            }}
          >
            아이디 찾기
          </button>
          <span aria-hidden="true">|</span>
          <button
            type="button"
            className="login-modal-link"
            onClick={() => {
              onClose();
              navigate("/reset-password");
            }}
          >
            비밀번호 찾기
          </button>
        </p>

        <div className="login-modal-divider">
          <span>또는</span>
        </div>

        <div className="login-modal-social-row">
          <button
            type="button"
            className="login-modal-social-circle login-modal-social-kakao"
            aria-label="카카오로 로그인"
            onClick={() => {
              // SPA 라우팅이 아니라 실제 브라우저 이동이어야 함 (백엔드가 카카오 로그인 화면으로 리다이렉트해줌)
              window.location.href = `${API_ORIGIN}/oauth2/authorization/kakao`;
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.87 5.19 4.68 6.58-.2.75-.73 2.73-.84 3.15-.13.52.19.51.4.37.17-.11 2.63-1.78 3.7-2.51.66.1 1.34.15 2.06.15 5.52 0 10-3.48 10-7.74C22 6.48 17.52 3 12 3Z" />
            </svg>
          </button>

          {/* 네이버 로그인 버튼은 백엔드 연동 완료 후 여기에 동일한 구조로 추가 예정 */}
        </div>

        <p className="login-modal-footer">
          계정이 없으신가요?{" "}
          <button
            type="button"
            className="login-modal-link"
            onClick={() => {
              onClose();
              navigate("/signup");
            }}
          >
            회원가입
          </button>
        </p>
      </form>
    </dialog>
  );
}

export default LoginModal;