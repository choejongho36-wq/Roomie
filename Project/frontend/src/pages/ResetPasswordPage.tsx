import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { requestPasswordReset, confirmEmailVerification, resetPassword } from "../api";
import "./AccountRecoveryPage.css";

type Step = "identify" | "code" | "newPassword" | "done";

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("identify");
  const [loginId, setLoginId] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const extractMessage = (err: unknown, fallback: string) =>
    axios.isAxiosError(err) && typeof err.response?.data === "string" ? err.response.data : fallback;

  const handleIdentify = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await requestPasswordReset(loginId, email);
      setStep("code");
    } catch (err) {
      setError(extractMessage(err, "인증번호 발송에 실패했습니다."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmCode = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await confirmEmailVerification(email, code);
      setStep("newPassword");
    } catch (err) {
      setError(extractMessage(err, "인증번호 확인에 실패했습니다."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!PASSWORD_PATTERN.test(newPassword)) {
      setError("비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다.");
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(loginId, email, newPassword);
      setStep("done");
    } catch (err) {
      setError(extractMessage(err, "비밀번호 변경에 실패했습니다."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="account-recovery-page">
      <form
        className="account-recovery-box"
        onSubmit={
          step === "identify" ? handleIdentify : step === "code" ? handleConfirmCode : handleResetPassword
        }
      >
        <h1>비밀번호 재설정</h1>

        {step === "identify" && (
          <>
            <p>아이디와 가입 시 등록한 이메일을 입력해주세요.</p>
            <label>
              아이디
              <input type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)} required />
            </label>
            <label>
              이메일
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            {error && <p className="account-recovery-error">{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "발송 중..." : "인증번호 받기"}
            </button>
          </>
        )}

        {step === "code" && (
          <>
            <p>{email}로 인증번호를 보냈어요. 메일함(스팸함 포함)을 확인해주세요.</p>
            <label>
              인증번호
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                required
              />
            </label>
            {error && <p className="account-recovery-error">{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "확인 중..." : "확인"}
            </button>
          </>
        )}

        {step === "newPassword" && (
          <>
            <p>새로 사용할 비밀번호를 입력해주세요.</p>
            <label>
              새 비밀번호
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                maxLength={24}
                required
              />
            </label>
            <label>
              새 비밀번호 확인
              <input
                type="password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                minLength={8}
                maxLength={24}
                required
              />
            </label>
            {error && <p className="account-recovery-error">{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "변경 중..." : "비밀번호 변경"}
            </button>
          </>
        )}

        {step === "done" && (
          <>
            <p>비밀번호가 변경됐어요. 새 비밀번호로 로그인해주세요.</p>
            <button type="button" className="btn btn-primary account-recovery-link-btn" onClick={() => navigate("/")}>
              홈으로 가기
            </button>
          </>
        )}

        {(step === "identify" || step === "code") && (
          <p className="account-recovery-footer">
            <Link to="/find-id">아이디를 잊으셨나요?</Link>
          </p>
        )}
      </form>
    </div>
  );
}

export default ResetPasswordPage;