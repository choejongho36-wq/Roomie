import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getMyProfile } from "../api";
import type { User } from "../types/user";

interface AuthContextValue {
  token: string | null;
  user: User | null;
  setUser: (user: User) => void;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    getMyProfile(token)
      .then(setUser)
      .catch(() => setUser(null));
  }, [token]);

  // api.ts의 axios 인터셉터가 401(세션 만료)을 감지하면 이 이벤트를 쏨 -> 여기서 로그인 상태를 정리
  useEffect(() => {
    const handleSessionExpired = () => {
      sessionStorage.removeItem("token");
      setToken(null);
      setUser(null);
    };
    window.addEventListener("session-expired", handleSessionExpired);
    return () => window.removeEventListener("session-expired", handleSessionExpired);
  }, []);

  const login = (newToken: string) => {
    sessionStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    sessionStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}