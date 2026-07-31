import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { requestFindId, confirmEmailVerification, getFindIdResult } from "../api";
import "./AccountRecoveryPage.css";

type Step = "email" | "code" | "result";

function FindIdPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loginId, setLoginId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const extractMessage = (err: unknown, fallback: string) =>
    axios.isAxiosError(err) && typeof err.response?.data === "string" ? err.response.data : fallback;

  const handleSendCode = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await requestFindId(email);
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
      const result = await getFindIdResult(email);
      setLoginId(result);
      setStep("result");
    } catch (err) {
      setError(extractMessage(err, "인증번호 확인에 실패했습니다."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="account-recovery-page">
      <form className="account-recovery-box" onSubmit={step === "email" ? handleSendCode : handleConfirmCode}>
        <h1>아이디 찾기</h1>

        {step === "email" && (
          <>
            <p>가입 시 등록한 이메일로 인증번호를 보내드려요.</p>
            <label>
              이메일
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
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

        {step === "result" && (
          <>
            <p className="account-recovery-result-label">회원님의 아이디는</p>
            <p className="account-recovery-result-value">{loginId}</p>
            <p>입니다.</p>
            <Link to="/" className="btn btn-primary account-recovery-link-btn">
              홈으로 가기
            </Link>
          </>
        )}

        {step !== "result" && (
          <p className="account-recovery-footer">
            <Link to="/reset-password">비밀번호를 잊으셨나요?</Link>
          </p>
        )}
      </form>
    </div>
  );
}

export default FindIdPage;