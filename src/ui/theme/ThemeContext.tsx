import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { getTheme, Theme } from "./theme.js";

export type ThemeMode = "system" | "light" | "dark";

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  theme: Theme;
  setThemeMode: (mode: ThemeMode) => void;
}

const THEME_STORAGE_KEY = "@anki_theme_mode_v1";

const ThemeContext = createContext<ThemeContextType>({
  themeMode: "system",
  isDark: false,
  theme: getTheme(false),
  setThemeMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (saved && (saved === "system" || saved === "light" || saved === "dark")) {
        setThemeModeState(saved);
      }
    }
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    }
  };

  const isDark =
    themeMode === "dark" || (themeMode === "system" && systemColorScheme === "dark");

  const currentTheme = getTheme(isDark);

  return (
    <ThemeContext.Provider value={{ themeMode, isDark, theme: currentTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
