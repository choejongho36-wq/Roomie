import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMySurveys } from "../api";
import { showToast } from "../components/Toast";

const MIN_LOADING_MS = 2000;
const MAX_LOADING_MS = 5000;

export function useMatchingRedirect() {
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // missingMatchingFields: user.missingMatchingFields (지역/흡연 등 매칭에 필요한데 아직 안 채운 항목들)
  const goToMatching = async (token: string, missingMatchingFields: string[] = []) => {
    if (missingMatchingFields.length > 0) {
      showToast(`매칭을 시작하려면 마이페이지에서 ${missingMatchingFields.join(", ")}을(를) 먼저 입력해주세요.`);
      navigate("/mypage");
      return;
    }

    let surveys;
    try {
      surveys = await getMySurveys(token);
    } catch {
      navigate("/survey");
      return;
    }

    if (surveys.length === 0) {
      navigate("/survey");
      return;
    }

    setIsRedirecting(true);
    const delay = MIN_LOADING_MS + Math.random() * (MAX_LOADING_MS - MIN_LOADING_MS);
    await new Promise((resolve) => setTimeout(resolve, delay));
    navigate("/recommend");
    setIsRedirecting(false);
  };

  return { isRedirecting, goToMatching };
}