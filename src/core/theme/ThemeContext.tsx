import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";
/** 사용자 선택값 — "system"은 OS 다크모드 설정을 실시간으로 따른다 (iOS와 동일). */
export type ThemePreference = Theme | "system";

interface ThemeContextValue {
  /** 실제 화면에 적용된 테마 (preference가 "system"이면 OS 설정으로 해석). */
  theme: Theme;
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  /** 현재 보이는 테마의 반대를 명시적으로 선택한다 (사이드바 토글용). */
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "fotstat.theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

function systemTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia?.(DARK_QUERY).matches ? "dark" : "light";
}

function initialPreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const saved = localStorage.getItem(STORAGE_KEY);
  // 기존 사용자의 명시적 light/dark 선택은 그대로 존중한다.
  if (saved === "light" || saved === "dark" || saved === "system") return saved;
  return "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] =
    useState<ThemePreference>(initialPreference);
  const [sysTheme, setSysTheme] = useState<Theme>(systemTheme);

  // OS 다크모드 변경을 실시간 반영 (preference가 "system"일 때만 화면에 영향).
  useEffect(() => {
    const mq = window.matchMedia?.(DARK_QUERY);
    if (!mq) return;
    const onChange = (e: MediaQueryListEvent) =>
      setSysTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const theme: Theme = preference === "system" ? sysTheme : preference;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, preference);
  }, [preference]);

  const setPreference = useCallback(
    (p: ThemePreference) => setPreferenceState(p),
    [],
  );
  const toggle = useCallback(
    () =>
      setPreferenceState((prev) => {
        const current = prev === "system" ? systemTheme() : prev;
        return current === "dark" ? "light" : "dark";
      }),
    [],
  );

  const value = useMemo(
    () => ({ theme, preference, setPreference, toggle }),
    [theme, preference, setPreference, toggle],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
