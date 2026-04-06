import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { siteSettings } from "../../data/siteSettings";

export type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  showThemeSwitcher: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "site-theme";

function getInitialTheme(): Theme {
  if (!siteSettings.showThemeSwitcher) {
    return siteSettings.defaultTheme;
  }

  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved === "light" || saved === "dark") {
    return saved;
  }

  return siteSettings.defaultTheme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  const setTheme = (nextTheme: Theme) => {
    if (!siteSettings.showThemeSwitcher) {
      setThemeState(siteSettings.defaultTheme);
      return;
    }

    setThemeState(nextTheme);
  };

  useEffect(() => {
    if (!siteSettings.showThemeSwitcher && theme !== siteSettings.defaultTheme) {
      setThemeState(siteSettings.defaultTheme);
      return;
    }

    localStorage.setItem(STORAGE_KEY, theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const value: ThemeContextValue = useMemo(
    () => ({
      theme,
      setTheme,
      showThemeSwitcher: siteSettings.showThemeSwitcher,
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}