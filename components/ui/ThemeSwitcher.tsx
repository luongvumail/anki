import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { ThemeMode, triggerHaptic, Spacing, Radii, Typography, Layout, BorderWidths } from "../../constants/theme";

interface ThemeSwitcherProps {
  style?: object;
}

export function ThemeSwitcher({ style }: ThemeSwitcherProps) {
  const { theme, themeMode, setThemeMode } = useTheme();

  const options: { mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { mode: "system", label: "Tự động", icon: "hardware-chip-outline" },
    { mode: "light", label: "Sáng", icon: "sunny-outline" },
    { mode: "dark", label: "Tối", icon: "moon-outline" },
  ];

  const handleSelect = (mode: ThemeMode) => {
    triggerHaptic("selection");
    setThemeMode(mode);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bgSoft, borderColor: theme.cardBorder }, style]}>
      {options.map((opt) => {
        const isActive = themeMode === opt.mode;
        return (
          <TouchableOpacity
            key={opt.mode}
            activeOpacity={0.8}
            onPress={() => handleSelect(opt.mode)}
            style={[
              styles.optionBtn,
              isActive && [
                styles.optionBtnActive,
                {
                  backgroundColor: theme.cardBg,
                  borderColor: theme.blue,
                  borderBottomColor: theme.blueDark,
                },
              ],
            ]}
          >
            <Ionicons
              name={opt.icon}
              size={Layout.iconMd}
              color={isActive ? theme.blue : theme.textMuted}
            />
            <Text
              style={[
                styles.optionText,
                { color: isActive ? theme.blue : theme.textMuted },
                isActive && styles.optionTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: Radii.lg,
    borderWidth: BorderWidths.thin,
    padding: Spacing.xs,
    gap: Spacing.xs,
  },
  optionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    gap: Spacing.xs,
    borderWidth: BorderWidths.thin,
    borderColor: "transparent",
  },
  optionBtnActive: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  optionText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.weight.bold,
  },
  optionTextActive: {
    fontWeight: Typography.weight.extraBold,
  },
});
