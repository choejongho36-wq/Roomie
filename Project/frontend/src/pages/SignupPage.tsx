import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  signup,
  checkLoginIdAvailability,
  checkNicknameAvailability,
  requestEmailVerification,
  confirmEmailVerification,
} from "../api";
import RegionPicker, { type RegionToken } from "../components/RegionPicker";
import { PASSWORD_PATTERN, PASSWORD_RULES } from "../utils/passwordRules";
import "./SignupPage.css";

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A11.6 11.6 0 0 1 12 5c7 0 11 7 11 7a13.16 13.16 0 0 1-2.29 3.35M6.61 6.61C3.9 8.24 2 12 2 12s4 7 10 7a9.8 9.8 0 0 0 4.39-1.02" />
      <path d="M1 1l22 22" />
    </svg>
  );
}

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 100 }, (_, i) => currentYear - i);
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);


const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};
const LOGIN_ID_PATTERN = /^[a-z0-9]{4,20}$/;
const PHONE_PATTERN = /^[0-9]{10,11}$/;
const NICKNAME_PATTERN = /^[a-zA-Z0-9가-힣]{2,10}$/;

type PasswordStrength = 0 | 1 | 2 | 3 | 4;


const getPasswordStrength = (pw: string): PasswordStrength => {
  if (!pw) return 0;
  let score = 0;
  const categoryCount = [/[A-Za-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((regex) =>
    regex.test(pw)
  ).length;
  if (categoryCount === 3 && pw.length >= 8) score++;
  if (categoryCount === 3 && pw.length >= 10) score++;
  if (categoryCount === 3 && pw.length >= 12) score++;
  if (categoryCount === 3 && pw.length >= 14) score++;
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

const JOB_OPTIONS = ["직장인", "학생", "프리랜서", "자영업", "무직", "기타"];
const SMOKING_TYPE_OPTIONS = [
  { value: "CIGARETTE", label: "연초" },
  { value: "HEATED", label: "궐련형" },
  { value: "LIQUID", label: "액상" },
];

const EMAIL_DOMAIN_OPTIONS = [
  "gmail.com",
  "naver.com",
  "daum.net",
  "kakao.com",
  "nate.com",
  "hanmail.net",
  "icloud.com",
];

// 이메일 상태를 좀 더 세분화해서, "중복확인"과 "인증"이 한 흐름으로 이어지게 관리
type EmailStatus = "idle" | "sending" | "sent" | "confirming" | "verified" | "taken" | "error";

function SignupPage() {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState("");
  const [loginIdCheckStatus, setLoginIdCheckStatus] = useState<CheckStatus>("idle");
  const [checkedLoginId, setCheckedLoginId] = useState(""); // 마지막으로 중복확인에 통과한 아이디 값
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle");
  const [verifiedEmail, setVerifiedEmail] = useState(""); // 인증까지 완료된 이메일 값
  const [emailSuggestionsOpen, setEmailSuggestionsOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [nickname, setNickname] = useState("");
  const [nicknameCheckStatus, setNicknameCheckStatus] = useState<CheckStatus>("idle");
  const [checkedNickname, setCheckedNickname] = useState(""); // 마지막으로 중복확인에 통과한 닉네임 값
  const [gender, setGender] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [regionTokens, setRegionTokens] = useState<RegionToken[]>([]);
  const [job, setJob] = useState("");
  const [smoking, setSmoking] = useState(""); // "" | "SMOKER" | "NON_SMOKER"
  const [smokingType, setSmokingType] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const passwordStrength = getPasswordStrength(password);
  const strengthMeta = STRENGTH_META[passwordStrength];
  const passwordAllValid = PASSWORD_RULES.every((rule) => rule.test(password));
  const [passwordConfirmFocused, setPasswordConfirmFocused] = useState(false);
  const passwordsMatch = passwordConfirm.length > 0 && password === passwordConfirm;

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

  const emailSuggestions = (() => {
    const atIndex = email.indexOf("@");
    if (atIndex === -1) return [];
    const local = email.slice(0, atIndex);
    const domainPart = email.slice(atIndex + 1);
    if (!local) return [];
    if (EMAIL_DOMAIN_OPTIONS.includes(domainPart)) return [];
    return EMAIL_DOMAIN_OPTIONS.filter((domain) => domain.startsWith(domainPart)).map(
      (domain) => `${local}@${domain}`
    );
  })();

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailSuggestionsOpen(true);
    if (value !== verifiedEmail) {
      setEmailStatus("idle");
      setVerificationCode("");
      setCodeError("");
    }
  };

  const selectEmailSuggestion = (value: string) => {
    handleEmailChange(value);
    setEmailSuggestionsOpen(false);
  };

  const handleSendVerification = async () => {
    setError("");
    if (!email) {
      setError("이메일을 먼저 입력해주세요.");
      return;
    }
    setEmailStatus("sending");
    try {
      await requestEmailVerification(email);
      setEmailStatus("sent");
      setVerificationCode("");
      setCodeError("");
    } catch (err) {
      const message =
        axios.isAxiosError(err) && typeof err.response?.data === "string" ? err.response.data : "";
      if (message.includes("이미 가입된")) {
        setEmailStatus("taken");
      } else {
        setEmailStatus("error");
      }
    }
  };

  const handleConfirmVerification = async () => {
    setCodeError("");
    if (!verificationCode) {
      setCodeError("인증번호를 입력해주세요.");
      return;
    }
    setEmailStatus("confirming");
    try {
      await confirmEmailVerification(email, verificationCode);
      setVerifiedEmail(email);
      setEmailStatus("verified");
    } catch (err) {
      const message =
        axios.isAxiosError(err) && typeof err.response?.data === "string"
          ? err.response.data
          : "인증번호 확인에 실패했습니다.";
      setCodeError(message);
      setEmailStatus("sent");
    }
  };

  const handleNicknameChange = (value: string) => {
    setNickname(value);
    if (value !== checkedNickname) {
      setNicknameCheckStatus("idle");
    }
  };

  const handleCheckNickname = async () => {
    setError("");
    if (!nickname) {
      setError("닉네임을 먼저 입력해주세요.");
      return;
    }
    if (!NICKNAME_PATTERN.test(nickname)) {
      setNicknameCheckStatus("error");
      return;
    }
    setNicknameCheckStatus("checking");
    try {
      const available = await checkNicknameAvailability(nickname);
      setCheckedNickname(nickname);
      setNicknameCheckStatus(available ? "available" : "taken");
    } catch {
      setNicknameCheckStatus("error");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (loginIdCheckStatus !== "available" || loginId !== checkedLoginId) {
      setError("아이디 중복확인을 완료해주세요.");
      return;
    }
    if (emailStatus !== "verified" || email !== verifiedEmail) {
      setError("이메일 인증을 완료해주세요.");
      return;
    }
    if (nicknameCheckStatus !== "available" || nickname !== checkedNickname) {
      setError("닉네임 중복확인을 완료해주세요.");
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
    if (!PHONE_PATTERN.test(phone)) {
      setError("휴대폰 번호는 숫자만 10~11자리로 입력해주세요.");
      return;
    }
    if (regionTokens.length === 0) {
      setError("거주(희망) 지역을 선택해주세요.");
      return;
    }
    if (!job) {
      setError("직업을 선택해주세요.");
      return;
    }
    if (!smoking) {
      setError("흡연 여부를 선택해주세요.");
      return;
    }
    if (smoking === "SMOKER" && !smokingType) {
      setError("흡연 종류를 선택해주세요.");
      return;
    }
    if (!agreeTerms || !agreePrivacy) {
      setError("이용약관과 개인정보처리방침에 모두 동의해주세요.");
      return;
    }

    const paddedMonth = birthMonth.padStart(2, "0");
    const paddedDay = birthDay.padStart(2, "0");
    const birthDate = `${birthYear}-${paddedMonth}-${paddedDay}`;

    try {
      await signup(
        loginId,
        email,
        password,
        nickname,
        gender,
        birthDate,
        phone,
        regionTokens.map((token) => token.label).join(", "),
        job,
        smoking,
        smoking === "SMOKER" ? smokingType : null
      );
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
              아이디는 4~20자로 입력해주세요.
            </small>
          )}
        </label>
        <label>
          이메일
          <div className="email-check-group email-autocomplete-wrapper">
            <input
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onFocus={() => setEmailSuggestionsOpen(true)}
              onBlur={() => {
                setTimeout(() => setEmailSuggestionsOpen(false), 120);
              }}
              autoComplete="off"
              disabled={emailStatus === "verified"}
              required
            />
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleSendVerification}
              disabled={
                emailStatus === "sending" || emailStatus === "confirming" || emailStatus === "verified"
              }
            >
              {emailStatus === "verified"
                ? "인증완료"
                : emailStatus === "sending"
                ? "발송 중..."
                : emailStatus === "sent"
                ? "재발송"
                : "인증"}
            </button>

            {emailSuggestionsOpen && emailSuggestions.length > 0 && (
              <ul className="email-autocomplete-list">
                {emailSuggestions.map((suggestion) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectEmailSuggestion(suggestion)}
                    >
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {emailStatus === "taken" && (
            <small className="signup-hint signup-hint-error">이미 가입된 이메일이에요.</small>
          )}
          {emailStatus === "error" && (
            <small className="signup-hint signup-hint-error">
              형식을 확인해주세요 (예: name@example.com)
            </small>
          )}
          {emailStatus === "verified" && (
            <small className="signup-hint signup-hint-success">이메일 인증이 완료됐어요.</small>
          )}

          {(emailStatus === "sent" || emailStatus === "confirming") && (
            <div className="email-verify-code-group">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="인증번호 6자리"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ""))}
              />
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleConfirmVerification}
                disabled={emailStatus === "confirming"}
              >
                {emailStatus === "confirming" ? "확인 중..." : "확인"}
              </button>
            </div>
          )}
          {emailStatus === "sent" && !codeError && (
            <small className="signup-hint">메일함(스팸함 포함)에서 인증번호를 확인해주세요.</small>
          )}
          {codeError && <small className="signup-hint signup-hint-error">{codeError}</small>}
        </label>
        <label>
          닉네임
          <div className="email-check-group">
            <input
              type="text"
              value={nickname}
              onChange={(e) => handleNicknameChange(e.target.value)}
              required
            />
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleCheckNickname}
              disabled={nicknameCheckStatus === "checking"}
            >
              {nicknameCheckStatus === "checking" ? "확인 중..." : "중복확인"}
            </button>
          </div>
          {nicknameCheckStatus === "available" && nickname === checkedNickname && (
            <small className="signup-hint signup-hint-success">사용 가능한 닉네임이에요.</small>
          )}
          {nicknameCheckStatus === "taken" && (
            <small className="signup-hint signup-hint-error">이미 사용 중인 닉네임이에요.</small>
          )}
          {nicknameCheckStatus === "error" && (
            <small className="signup-hint signup-hint-error">
              닉네임은 한글/영문/숫자 2~10자로 입력해주세요.
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
          <div className="password-field-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              minLength={8}
              maxLength={24}
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword((prev) => !prev)}
              tabIndex={-1}
              aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
            {passwordFocused && !passwordAllValid && (
              <div className="password-checklist-bubble" role="tooltip">
                <ul className="password-checklist-list">
                  {PASSWORD_RULES.map((rule) => {
                    const met = rule.test(password);
                    return (
                      <li
                        key={rule.key}
                        className={`password-checklist-item${met ? " met" : ""}`}
                      >
                        <span className="password-checklist-icon">{met ? "✓" : "·"}</span>
                        {rule.label}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
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
        </label>
        <label>
          비밀번호 확인
          <div className="password-field-wrapper">
            <input
              type={showPasswordConfirm ? "text" : "password"}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              onFocus={() => setPasswordConfirmFocused(true)}
              onBlur={() => setPasswordConfirmFocused(false)}
              minLength={8}
              maxLength={24}
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPasswordConfirm((prev) => !prev)}
              tabIndex={-1}
              aria-label={showPasswordConfirm ? "비밀번호 숨기기" : "비밀번호 보기"}
            >
              {showPasswordConfirm ? <EyeOffIcon /> : <EyeIcon />}
            </button>
            {passwordConfirmFocused && passwordConfirm.length > 0 && (
              <div className="password-checklist-bubble password-match-bubble" role="tooltip">
                <p className={`password-match-message ${passwordsMatch ? "match" : "mismatch"}`}>
                  <span className="password-checklist-icon">{passwordsMatch ? "✓" : "·"}</span>
                  {passwordsMatch ? "비밀번호가 일치해요" : "비밀번호가 일치하지 않아요"}
                </p>
              </div>
            )}
          </div>
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
                setBirthDay("");
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
        <label>
          거주(희망) 지역
          <RegionPicker
            selected={regionTokens}
            onChange={setRegionTokens}
            multiple={true}
            maxSelect={3}
            variant="inline"
            triggerLabel="지역 선택"
            placeholder="지역명 검색 예) 강남, 역삼동, 강남구 역삼동"
            emptyHint="희망 지역을 최대 3개까지 선택해주세요."
          />
        </label>
        <label>
          직업
          <select value={job} onChange={(e) => setJob(e.target.value)} required>
            <option value="" disabled>
              선택해주세요
            </option>
            {JOB_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          흡연 여부
          <select
            value={smoking}
            onChange={(e) => {
              setSmoking(e.target.value);
              if (e.target.value !== "SMOKER") setSmokingType(""); // 비흡연자로 바꾸면 종류 선택은 초기화
            }}
            required
          >
            <option value="" disabled>
              선택해주세요
            </option>
            <option value="NON_SMOKER">비흡연자</option>
            <option value="SMOKER">흡연자</option>
          </select>
        </label>
        {smoking === "SMOKER" && (
          <label>
            흡연 종류
            <select value={smokingType} onChange={(e) => setSmokingType(e.target.value)} required>
              <option value="" disabled>
                선택해주세요
              </option>
              {SMOKING_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="signup-terms">
          <label className="signup-terms-all">
            <input
              type="checkbox"
              checked={agreeTerms && agreePrivacy}
              onChange={(e) => {
                setAgreeTerms(e.target.checked);
                setAgreePrivacy(e.target.checked);
              }}
            />
            전체 동의합니다
          </label>
          <label className="signup-terms-item">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              required
            />
            <span>
              (필수) <a href="/terms" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>이용약관</a>에 동의합니다
            </span>
          </label>
          <label className="signup-terms-item">
            <input
              type="checkbox"
              checked={agreePrivacy}
              onChange={(e) => setAgreePrivacy(e.target.checked)}
              required
            />
            <span>
              (필수) <a href="/privacy" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>개인정보처리방침</a>에 동의합니다
            </span>
          </label>
        </div>
        {error && <p className="signup-error">{error}</p>}
        <button type="submit" className="btn btn-primary">
          가입하기
        </button>
      </form>
    </div>
  );
}

export default SignupPage;