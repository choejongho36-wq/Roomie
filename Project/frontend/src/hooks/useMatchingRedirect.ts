import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMySurveys } from "../api";

const MIN_LOADING_MS = 2000;
const MAX_LOADING_MS = 5000;

export function useMatchingRedirect() {
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const goToMatching = async (token: string) => {
    setIsRedirecting(true);
    const delay = MIN_LOADING_MS + Math.random() * (MAX_LOADING_MS - MIN_LOADING_MS);
    const wait = new Promise((resolve) => setTimeout(resolve, delay));

    try {
      const [surveys] = await Promise.all([getMySurveys(token), wait]);
      navigate(surveys.length > 0 ? "/recommend" : "/survey");
    } catch {
      await wait;
      navigate("/survey");
    } finally {
      setIsRedirecting(false);
    }
  };

  return { isRedirecting, goToMatching };
}
