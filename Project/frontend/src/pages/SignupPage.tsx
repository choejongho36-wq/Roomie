import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { signup , checkEmailAvailability, checkLoginIdAvailability } from "../api";
import "./SignupPage.css";

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 100 }, (_, i) => currentYear - i); 
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);


const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;
const LOGIN_ID_PATTERN = /^[a-z0-9]{4,20}$/;
const PHONE_PATTERN = /^[0-9]{10,11}$/;

type PasswordStrength = 0 | 1 | 2 | 3 | 4;


const getPasswordStrength = (pw: string): PasswordStrength => {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  const categoryCount = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((regex) =>
    regex.test(pw)
  ).length;
  if (categoryCount >= 3) score++;
  if (categoryCount === 4 && pw.length >= 10) score++;
  return Math.min(score, 4) as PasswordStrength;
};

const STRENGTH_META: Record<PasswordStrength, { label: string; color: string }> = {
  0: { label: "매우 약함", color: "#e03131" },
  1: { label: "약함", color: "#f08c00" },
  2: { label: "보통", color: "#f2b705" },
  3: { label: "강함", color: "#2f9e44" },
  4: { label: "매우 강함", color: "#1971c2" },
};

type CheckStatus = "idle" | "checking" | "available" | "taken" | "error";

function SignupPage() {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState("");
  const [loginIdCheckStatus, setLoginIdCheckStatus] = useState<CheckStatus>("idle");
  const [checkedLoginId, setCheckedLoginId] = useState(""); // 마지막으로 중복확인에 통과한 아이디 값
  const [email, setEmail] = useState("");
  const [emailCheckStatus, setEmailCheckStatus] = useState<CheckStatus>("idle");
  const [checkedEmail, setCheckedEmail] = useState(""); // 마지막으로 중복확인에 통과한 이메일 값
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [phone, setPhone] = useState("");
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);


  const passwordStrength = getPasswordStrength(password);
  const strengthMeta = STRENGTH_META[passwordStrength];

  const dayOptions = (() => {
    if (!birthYear || !birthMonth) return Array.from({ length: 31 }, (_, i) => i + 1);
    const count = getDaysInMonth(Number(birthYear), Number(birthMonth));
    return Array.from({ length: count }, (_, i) => i + 1);
  })();

  const handleLoginIdChange = (value: string) => {
    setLoginId(value);

    if (value !== checkedLoginId) {
      setLoginIdCheckStatus("idle");
    }
  };

  const handleCheckLoginId = async () => {
    setError("");
    if (!loginId) {
      setError("아이디를 먼저 입력해주세요.");
      return;
    }
    if (!LOGIN_ID_PATTERN.test(loginId)) {
      setLoginIdCheckStatus("error");
      return;
    }
    setLoginIdCheckStatus("checking");
    try {
      const available = await checkLoginIdAvailability(loginId);
      setCheckedLoginId(loginId);
      setLoginIdCheckStatus(available ? "available" : "taken");
    } catch {
      setLoginIdCheckStatus("error");
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);

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
          아이디
          <div className="email-check-group">
            <input
              type="text"
              value={loginId}
              onChange={(e) => handleLoginIdChange(e.target.value)}
              required
            />
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleCheckLoginId}
              disabled={loginIdCheckStatus === "checking"}
            >
              {loginIdCheckStatus === "checking" ? "확인 중..." : "중복확인"}
            </button>
          </div>
          {loginIdCheckStatus === "available" && loginId === checkedLoginId && (
            <small className="signup-hint signup-hint-success">사용 가능한 아이디예요.</small>
          )}
          {loginIdCheckStatus === "taken" && (
            <small className="signup-hint signup-hint-error">이미 사용 중인 아이디예요.</small>
          )}
          {loginIdCheckStatus === "error" && (
            <small className="signup-hint signup-hint-error">
             4~20자로 입력해주세요.
            </small>
          )}
        </label>
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
          휴대폰 번호
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="숫자만 입력 (예: 01012345678)"
            maxLength={11}
            required
          />
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
           <div className="password-strength">
            <div className="password-strength-bar">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="password-strength-segment"
                  style={
                    i < passwordStrength ? { backgroundColor: strengthMeta.color } : undefined
                  }
                />
              ))}
            </div>
            {password && (
              <small className="password-strength-label" style={{ color: strengthMeta.color }}>
                {strengthMeta.label}
              </small>
            )}
          </div>
          <small className="signup-hint">영문, 숫자, 특수문자를 모두 포함해 8자 이상 24자 이하</small>
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