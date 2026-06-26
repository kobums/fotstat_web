import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ApiError,
  UNAUTHORIZED_EVENT,
  setRefreshToken,
  setToken,
} from "../api/client";
import { authApi } from "../api/endpoints";
import type { AuthResponse, User } from "../api/types";

const USER_KEY = "fotstat.user";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  loginEmail: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginGuest: () => Promise<void>;
  upgrade: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadUser(): User | null {
  // The backend has no "current user" endpoint, so we persist the user object
  // returned at login alongside the token to restore the session on reload.
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadUser);

  const applyAuth = useCallback((res: AuthResponse) => {
    if (res.code !== "ok" || !res.token || !res.user) {
      throw new ApiError(res.message ?? "로그인에 실패했습니다.", 400);
    }
    setToken(res.token);
    // Persist the refresh token so the session can be renewed silently after the
    // short-lived access JWT expires (otherwise the user is bounced to login).
    setRefreshToken(res.refresh ?? null);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setUser(res.user);
  }, []);

  const clearAuth = useCallback(() => {
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  // Log out when any request reports the token is no longer valid.
  useEffect(() => {
    const handler = () => clearAuth();
    window.addEventListener(UNAUTHORIZED_EVENT, handler);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handler);
  }, [clearAuth]);

  const loginEmail = useCallback(
    async (email: string, password: string) => {
      applyAuth(await authApi.loginEmail(email, password));
    },
    [applyAuth],
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      applyAuth(await authApi.register(email, password, name));
    },
    [applyAuth],
  );

  const loginGuest = useCallback(async () => {
    applyAuth(await authApi.guest());
  }, [applyAuth]);

  const upgrade = useCallback(
    async (email: string, password: string, name: string) => {
      applyAuth(await authApi.upgrade(email, password, name));
    },
    [applyAuth],
  );

  const deleteAccount = useCallback(async () => {
    await authApi.deleteAccount();
    clearAuth();
  }, [clearAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      loginEmail,
      register,
      loginGuest,
      upgrade,
      logout: clearAuth,
      deleteAccount,
    }),
    [user, loginEmail, register, loginGuest, upgrade, clearAuth, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
