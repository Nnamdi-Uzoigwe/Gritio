import { getSetting, setSetting } from "@/db/repositories/settings";
import type { ThemeMode } from "@/types/domain";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useColorScheme } from "react-native";
import { darkColors, lightColors, type ColorTokens } from "./tokens";

type ThemeContextValue = {
  colors: ColorTokens;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const isThemeMode = (v: string | null): v is ThemeMode =>
  v === "light" || v === "dark" || v === "system";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("light"); // light is the default

  useEffect(() => {
    let active = true;
    getSetting("theme_mode")
      .then((stored) => {
        if (active && isThemeMode(stored)) setModeState(stored);
      })
      .catch((error) => console.warn("Could not load theme preference", error));
    return () => {
      active = false;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    setSetting("theme_mode", next).catch((error) =>
      console.warn("Could not save theme preference", error),
    );
  }, []);

  const isDark = mode === "system" ? systemScheme === "dark" : mode === "dark";

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: isDark ? darkColors : lightColors,
      isDark,
      mode,
      setMode,
    }),
    [isDark, mode, setMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
