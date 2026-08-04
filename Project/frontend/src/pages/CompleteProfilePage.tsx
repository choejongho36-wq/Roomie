import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { completeAdditionalInfo } from "../api";
import { useAuth } from "../context/AuthContext";
import RegionPicker, { type RegionToken } from "../components/RegionPicker";
import "./CompleteProfilePage.css";

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 100 }, (_, i) => currentYear - i);
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
const PHONE_PATTERN = /^[0-9]{10,11}$/;
const JOB_OPTIONS = ["직장인", "학생", "프리랜서", "자영업", "무직", "기타"];
const SMOKING_TYPE_OPTIONS = [
  { value: "CIGARETTE", label: "연초" },
  { value: "HEATED", label: "궐련형" },
  { value: "LIQUID", label: "액상" },
];

const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};

function CompleteProfilePage() {
  const navigate = useNavigate();
  const { token, setUser, logout } = useAuth();

  const [gender, setGender] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [phone, setPhone] = useState("");
  const [regionTokens, setRegionTokens] = useState<RegionToken[]>([]);
  const [job, setJob] = useState("");
  const [smoking, setSmoking] = useState("");
  const [smokingType, setSmokingType] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const dayOptions = (() => {
    if (!birthYear || !birthMonth) return Array.from({ length: 31 }, (_, i) => i + 1);
    const count = getDaysInMonth(Number(birthYear), Number(birthMonth));
    return Array.from({ length: count }, (_, i) => i + 1);
  })();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!gender) {
      setError("성별을 선택해주세요.");
      return;
    }
    if (!birthYear || !birthMonth || !birthDay) {
      setError("생년월일을 모두 선택해주세요.");
      return;
    }
    if (phone && !PHONE_PATTERN.test(phone)) {
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
    if (!token) {
      setError("로그인 정보가 없습니다. 다시 로그인해주세요.");
      return;
    }

    const birthDate = `${birthYear}-${birthMonth.padStart(2, "0")}-${birthDay.padStart(2, "0")}`;

    try {
      setSubmitting(true);
      const updatedUser = await completeAdditionalInfo(
        token,
        gender,
        birthDate,
        phone,
        regionTokens[0].label,
        job,
        smoking,
        smoking === "SMOKER" ? smokingType : null
      );
      setUser(updatedUser);
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
          휴대폰 번호 <span className="complete-profile-optional">(선택)</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="숫자만 입력"
            maxLength={11}
          />
        </label>

        <label>
          거주(희망) 지역
          <RegionPicker
            selected={regionTokens}
            onChange={setRegionTokens}
            multiple={false}
            variant="inline"
            triggerLabel="지역 선택"
            emptyHint="지역을 선택해주세요."
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
              if (e.target.value !== "SMOKER") setSmokingType("");
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