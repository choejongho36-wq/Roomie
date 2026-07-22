import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { signup } from "../api";
import "./SignupPage.css";

function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await signup(email, password, nickname);
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
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
        {error && <p className="signup-error">{error}</p>}
        <button type="submit" className="btn btn-primary">
          가입하기
        </button>
      </form>
    </div>
  );
}

export default SignupPage;
