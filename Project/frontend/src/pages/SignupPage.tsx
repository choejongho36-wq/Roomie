import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { signup, checkEmailAvailability } from "../api";
import "./SignupPage.css";

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 100 }, (_, i) => currentYear - i); // 올해 ~ 100년 전
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

// 선택된 연/월 기준으로 그 달의 실제 일수를 계산 (2월 30일 같은 값 방지)
const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

type EmailCheckStatus = "idle" | "checking" | "available" | "taken" | "error";

function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [emailCheckStatus, setEmailCheckStatus] = useState<EmailCheckStatus>("idle");
  const [checkedEmail, setCheckedEmail] = useState(""); // 마지막으로 중복확인에 통과한 이메일 값
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const dayOptions = (() => {
    if (!birthYear || !birthMonth) return Array.from({ length: 31 }, (_, i) => i + 1);
    const count = getDaysInMonth(Number(birthYear), Number(birthMonth));
    return Array.from({ length: count }, (_, i) => i + 1);
  })();

  const handleEmailChange = (value: string) => {
    setEmail(value);
    // 중복확인 통과한 값과 지금 값이 달라지면, 다시 확인해야 하니 상태 초기화
    if (value !== checkedEmail) {
      setEmailCheckStatus("idle");
    }
  };

  const handleCheckEmail = async () => {
    setError("");
    if (!email) {
      setError("이메일을 먼저 입력해주세요.");
      return;
    }
    setEmailCheckStatus("checking");
    try {
      const available = await checkEmailAvailability(email);
      setCheckedEmail(email);
      setEmailCheckStatus(available ? "available" : "taken");
    } catch {
      setEmailCheckStatus("error");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (emailCheckStatus !== "available" || email !== checkedEmail) {
      setError("이메일 중복확인을 완료해주세요.");
      return;
    }
    if (!PASSWORD_PATTERN.test(password)) {
      setError("비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (!birthYear || !birthMonth || !birthDay) {
      setError("생년월일을 모두 선택해주세요.");
      return;
    }

    const paddedMonth = birthMonth.padStart(2, "0");
    const paddedDay = birthDay.padStart(2, "0");
    const birthDate = `${birthYear}-${paddedMonth}-${paddedDay}`;

    try {
      await signup(email, password, nickname, gender, birthDate);
      setSuccess(true);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && typeof err.response?.data === "string"
          ? err.response.data
          : "회원가입에 실패했습니다.";
      setError(message);
    }
  };

  if (success) {
    return (
      <div className="signup-page">
        <div className="signup-box">
          <h1>가입이 완료됐어요</h1>
          <p>이제 로그인해서 Roomie를 이용해보세요.</p>
          <button className="btn btn-primary" onClick={() => navigate("/")}>
            홈으로 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="signup-page">
      <form className="signup-box" onSubmit={handleSubmit}>
        <h1>회원가입</h1>
        <label>
          이메일
          <div className="email-check-group">
            <input
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              required
            />
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleCheckEmail}
              disabled={emailCheckStatus === "checking"}
            >
              {emailCheckStatus === "checking" ? "확인 중..." : "중복확인"}
            </button>
          </div>
          {emailCheckStatus === "available" && email === checkedEmail && (
            <small className="signup-hint signup-hint-success">사용 가능한 이메일이에요.</small>
          )}
          {emailCheckStatus === "taken" && (
            <small className="signup-hint signup-hint-error">이미 가입된 이메일이에요.</small>
          )}
          {emailCheckStatus === "error" && (
            <small className="signup-hint signup-hint-error">
              형식을 확인해주세요 (예: name@example.com)
            </small>
          )}
        </label>
        <label>
          비밀번호
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          <small className="signup-hint">영문, 숫자, 특수문자를 모두 포함해 8자 이상</small>
        </label>
        <label>
          비밀번호 확인
          <input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            minLength={8}
            required
          />
        </label>
        <label>
          닉네임
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
          />
        </label>
        <label>
          성별
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            required
          >
            <option value="" disabled>
              선택해주세요
            </option>
            <option value="M">남성</option>
            <option value="F">여성</option>
          </select>
        </label>
        <label>
          생년월일
          <div className="birth-select-group">
            <select
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              required
            >
              <option value="" disabled>
                년
              </option>
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </select>
            <select
              value={birthMonth}
              onChange={(e) => {
                setBirthMonth(e.target.value);
                setBirthDay(""); // 월이 바뀌면 일 선택 초기화
              }}
              required
            >
              <option value="" disabled>
                월
              </option>
              {MONTH_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}월
                </option>
              ))}
            </select>
            <select
              value={birthDay}
              onChange={(e) => setBirthDay(e.target.value)}
              required
            >
              <option value="" disabled>
                일
              </option>
              {dayOptions.map((d) => (
                <option key={d} value={d}>
                  {d}일
                </option>
              ))}
            </select>
          </div>
        </label>
        {error && <p className="signup-error">{error}</p>}
        <button type="submit" className="btn btn-primary">
          가입하기
        </button>
      </form>
    </div>
  );
}

export default SignupPage;