export const lightColors = {
  primary: "#059669",
  primaryShadow: "#047857",
  secondary: "#D97706",
  secondaryShadow: "#B45309",
  danger: "#DC2626",
  dangerShadow: "#991B1B",
  info: "#2563EB",
  infoShadow: "#1D4ED8",
  bg: "#F8FAFC",
  cardBg: "#FFFFFF",
  cardBorder: "transparent",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textLight: "#94A3B8",
  white: "#FFFFFF",
};

export const darkColors = {
  primary: "#10B981",
  primaryShadow: "#059669",
  secondary: "#F59E0B",
  secondaryShadow: "#D97706",
  danger: "#EF4444",
  dangerShadow: "#DC2626",
  info: "#3B82F6",
  infoShadow: "#2563EB",
  bg: "#0F172A",
  cardBg: "#1E293B",
  cardBorder: "transparent",
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  textLight: "#64748B",
  white: "#FFFFFF",
};

export const getTheme = (isDark = false) => {
  const colors = isDark ? darkColors : lightColors;

  return {
    isDark,
    colors,
    badges: {
      due: {
        bg: isDark ? "#450A0A" : "#FEE2E2",
        text: isDark ? "#F87171" : "#DC2626",
        border: "transparent",
      },
      learned: {
        bg: isDark ? "#064E3B" : "#D1FAE5",
        text: isDark ? "#34D399" : "#059669",
        border: "transparent",
      },
      new: {
        bg: isDark ? "#0C4A6E" : "#E0F2FE",
        text: isDark ? "#38BDF8" : "#0284C7",
        border: "transparent",
      },
      warning: {
        bg: isDark ? "#451A03" : "#FEF3C7",
        text: isDark ? "#FBBF24" : "#D97706",
        border: "transparent",
      },
      info: {
        bg: isDark ? "#172554" : "#EFF6FF",
        text: isDark ? "#60A5FA" : "#2563EB",
        border: "transparent",
      },
      neutral: {
        bg: isDark ? "#334155" : "#F1F5F9",
        text: isDark ? "#CBD5E1" : "#475569",
        border: "transparent",
      },
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
      xxl: 32,
      hero: 40,
    },
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      title: 28,
      hero: 64,
    },
    fontWeight: {
      regular: "400" as const,
      medium: "500" as const,
      semibold: "600" as const,
      bold: "700" as const,
      black: "900" as const,
    },
    radius: {
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
      full: 9999,
    },
    shadows: {
      sm: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.05,
        shadowRadius: 4,
        elevation: 2,
      },
      md: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.4 : 0.08,
        shadowRadius: 8,
        elevation: 4,
      },
      lg: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDark ? 0.5 : 0.12,
        shadowRadius: 16,
        elevation: 8,
      },
    },
  };
};

export const theme = getTheme(false);
export type Theme = ReturnType<typeof getTheme>;

