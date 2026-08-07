import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { completeAdditionalInfo, completeSocialSignup, checkNicknameAvailability } from "../api";
import { useAuth } from "../context/AuthContext";
import "./CompleteProfilePage.css";

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 100 }, (_, i) => currentYear - i);
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
const PHONE_PATTERN = /^[0-9]{10,11}$/;
const NICKNAME_PATTERN = /^[a-zA-Z0-9가-힣]{2,10}$/;
const JOB_OPTIONS = ["직장인", "학생", "프리랜서", "자영업", "무직", "기타"];

type CheckStatus = "idle" | "checking" | "available" | "taken" | "error";

const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};

function CompleteProfilePage() {
  const navigate = useNavigate();
  const { token, setUser, logout, login } = useAuth();
  const [searchParams] = useSearchParams();
  // ticket이 있으면 "아직 계정 자체가 없는" 신규 소셜가입 상태 (카카오 인증만 통과한 상태)
  const ticket = searchParams.get("ticket");
  // 카카오에서 가져온 기본 닉네임 (수정 가능한 초기값으로만 사용)
  const defaultNickname = searchParams.get("nickname") ?? "";

  const [nickname, setNickname] = useState(defaultNickname);
  const [nicknameCheckStatus, setNicknameCheckStatus] = useState<CheckStatus>("idle");
  const [checkedNickname, setCheckedNickname] = useState(""); // 마지막으로 중복확인에 통과한 닉네임 값
  const [gender, setGender] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [phone, setPhone] = useState("");
  const [job, setJob] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const dayOptions = (() => {
    if (!birthYear || !birthMonth) return Array.from({ length: 31 }, (_, i) => i + 1);
    const count = getDaysInMonth(Number(birthYear), Number(birthMonth));
    return Array.from({ length: count }, (_, i) => i + 1);
  })();

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

    if (nicknameCheckStatus !== "available" || nickname !== checkedNickname) {
      setError("닉네임 중복확인을 완료해주세요.");
      return;
    }
    if (!gender) {
      setError("성별을 선택해주세요.");
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
    if (!job) {
      setError("직업을 선택해주세요.");
      return;
    }
    if (!agreeTerms || !agreePrivacy) {
      setError("이용약관과 개인정보처리방침에 모두 동의해주세요.");
      return;
    }
    if (!token && !ticket) {
      setError("로그인 정보가 없습니다. 다시 로그인해주세요.");
      return;
    }

    const birthDate = `${birthYear}-${birthMonth.padStart(2, "0")}-${birthDay.padStart(2, "0")}`;

    try {
      setSubmitting(true);
      if (ticket) {
        // 신규 소셜가입: 이 요청이 성공해야 그제서야 DB에 계정이 만들어짐
        const issuedToken = await completeSocialSignup(ticket, nickname, gender, birthDate, phone, job);
        login(issuedToken);
      } else {
        const updatedUser = await completeAdditionalInfo(token!, nickname, gender, birthDate, phone, job);
        setUser(updatedUser);
      }
      navigate("/", { replace: true });
    } catch (err) {
      const message =
        axios.isAxiosError(err) && typeof err.response?.data === "string"
          ? err.response.data
          : "저장에 실패했습니다.";
      setError(message);
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (ticket) {
      // 티켓만 있고 아직 로그인/계정 자체가 없는 상태라, 그냥 화면만 나가면 됨 (DB엔 애초에 아무것도 안 만들어졌음)
      navigate("/", { replace: true });
      return;
    }
    // 여기서 만든 계정 자체는 DB에 남지만(다음에 같은 소셜 계정으로 로그인하면 이어서 계속할 수 있음),
    // 지금 로그인 상태만 끊어서 "가입 중" 상태로 사이트를 돌아다니는 걸 막음
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="complete-profile-page">
      <form className="complete-profile-box" onSubmit={handleSubmit}>
        <h1>거의 다 됐어요!</h1>
        <p>소셜 로그인 계정에는 몇 가지 정보가 더 필요해요.</p>

        <label>
          닉네임
          <div className="email-check-group">
            <input
              type="text"
              value={nickname}
              onChange={(e) => handleNicknameChange(e.target.value)}
              placeholder="2~10자, 한글/영문/숫자"
              maxLength={10}
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
          성별
          <select value={gender} onChange={(e) => setGender(e.target.value)} required>
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
            <select value={birthYear} onChange={(e) => setBirthYear(e.target.value)} required>
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
            <select value={birthDay} onChange={(e) => setBirthDay(e.target.value)} required>
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

        <p className="complete-profile-hint">
          거주 지역과 흡연 여부는 나중에 마이페이지에서 입력하시면 돼요. (매칭을 시작하려면 그때 필요해요)
        </p>

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

        {error && <p className="complete-profile-error">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "저장 중..." : "완료"}
        </button>
        <button
          type="button"
          className="complete-profile-cancel-btn"
          onClick={handleCancel}
          disabled={submitting}
        >
          취소하고 홈으로
        </button>
      </form>
    </div>
  );
}

export default CompleteProfilePage;