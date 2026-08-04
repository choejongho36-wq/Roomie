import { useEffect, useState } from "react";
import "./Toast.css";

// 어디서든(리액트 컴포넌트가 아닌 곳, 예: api.ts의 axios 인터셉터에서도) 이 함수 하나만 호출하면
// 화면에 토스트 메시지가 뜸. window 커스텀 이벤트로 전달하는 방식이라 별도 상태관리 라이브러리 없이도 동작함.
export const showToast = (message: string) => {
  window.dispatchEvent(new CustomEvent("app-toast", { detail: message }));
};

const TOAST_DURATION_MS = 3500;

function Toast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleToastEvent = (event: Event) => {
      const custom = event as CustomEvent<string>;
      setMessage(custom.detail);
    };
    window.addEventListener("app-toast", handleToastEvent);
    return () => window.removeEventListener("app-toast", handleToastEvent);
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message) return null;

  return (
    <div className="app-toast" role="status">
      {message}
    </div>
  );
}

export default Toast;