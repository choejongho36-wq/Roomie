import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { linkAccount } from "../api";
import { useAuth } from "../context/AuthContext";
import "./AccountRecoveryPage.css";

// 카카오 로그인 시도 중, 같은 이메일의 일반가입 계정이 이미 있을 때 도착하는 페이지.
// URL의 ticket(5분짜리 연동 티켓) + 기존 계정 비밀번호를 함께 보내 연동을 완료한다.
function LinkAccountPage() {
  const navigate = useNavigate();
  const { login: applyLogin } = useAuth();
  const [searchParams] = useSearchParams();
  const ticket = searchParams.get("ticket") ?? "";

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!ticket) {
      setError("연동 정보가 없어요. 카카오 로그인을 다시 시도해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const token = await linkAccount(ticket, password);
      applyLogin(token);
      navigate("/", { replace: true });
    } catch (err) {
      const message =
        axios.isAxiosError(err) && typeof err.response?.data === "string"
          ? err.response.data
          : "연동에 실패했습니다.";
      setError(message);
      setSubmitting(false);
    }
  };

  return (
    <div className="account-recovery-page">
      <form className="account-recovery-box" onSubmit={handleSubmit}>
        <h1>계정 연동</h1>
        <p>
          이 이메일로 이미 가입된 계정이 있어요.
          <br />
          기존 계정의 비밀번호를 입력하면 카카오 계정과 연동돼요.
          <br />
          연동 후에는 카카오로도, 아이디/비밀번호로도 같은 계정에 로그인할 수 있어요.
        </p>
        <label>
          기존 계정 비밀번호
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="account-recovery-error">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "연동 중..." : "연동하고 로그인"}
        </button>
        <p className="account-recovery-footer">
          <Link to="/reset-password">비밀번호를 잊으셨나요?</Link>
        </p>
      </form>
    </div>
  );
}

export default LinkAccountPage;