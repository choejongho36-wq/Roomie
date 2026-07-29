import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMySurveys } from "../api";

const MIN_LOADING_MS = 2000;
const MAX_LOADING_MS = 5000;

export function useMatchingRedirect() {
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const goToMatching = async (token: string) => {
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
