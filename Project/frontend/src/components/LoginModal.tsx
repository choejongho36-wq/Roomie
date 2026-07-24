import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { login } from "../api";
import "./LoginModal.css";

interface LoginModalProps {
  onClose: () => void;
  onLoginSuccess: (token: string) => void;
}

function LoginModal({ onClose, onLoginSuccess }: LoginModalProps) {
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const token = await login(email, password);
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
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <form onSubmit={handleSubmit} className="login-modal-form">
        <button type="button" className="login-modal-close" onClick={onClose} aria-label="닫기">
          ×
        </button>
        <h2>로그인</h2>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
