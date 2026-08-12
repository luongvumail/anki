import React, { useState, useRef } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { Spacing, Typography, Layout, BorderWidths } from "../../constants/theme";
import { DuolingoCard } from "./DuolingoCard";

export interface AuthFieldProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "words" | "sentences" | "characters";
  autoCorrect?: boolean;
  secureTextEntry?: boolean;
}

export function AuthField({
  label,
  icon,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  autoCapitalize = "sentences",
  autoCorrect = true,
  secureTextEntry = false,
}: AuthFieldProps) {
  const [focused, setFocused] = useState(false);
  const [showText, setShowText] = useState(false);
  const { theme } = useTheme();
  const inputRef = useRef<TextInput>(null);

  return (
    <Pressable onPress={() => inputRef.current?.focus()}>
      <DuolingoCard
        style={StyleSheet.flatten([
          styles.fieldCard,
          { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
        ])}
        padding={Spacing.md}
      >
        <View style={styles.fieldRow}>
          <View style={styles.fieldIconWrap}>
            <Ionicons
              name={icon}
              size={Layout.iconMd}
              color={focused ? theme.blue : theme.textMuted}
            />
          </View>
          <View style={styles.fieldBody}>
            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{label}</Text>
            <TextInput
              ref={inputRef}
              style={[styles.fieldInput, { color: theme.textPrimary }]}
              placeholder={placeholder}
              placeholderTextColor={theme.textMuted}
              value={value}
              onChangeText={onChangeText}
              keyboardType={keyboardType}
              autoCapitalize={autoCapitalize}
              autoCorrect={autoCorrect}
              secureTextEntry={secureTextEntry && !showText}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
          </View>
          {secureTextEntry && (
            <Pressable
              onPress={() => setShowText((v) => !v)}
              style={styles.eyeBtn}
              hitSlop={Layout.hitSlopMd}
            >
              <Ionicons
                name={showText ? "eye-off-outline" : "eye-outline"}
                size={Layout.iconMd}
                color={theme.textMuted}
              />
            </Pressable>
          )}
        </View>
      </DuolingoCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fieldCard: {
    borderWidth: BorderWidths.default,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.cellPadding,
  },
  fieldIconWrap: {
    width: Layout.avatarSm,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldBody: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: Typography.caption2.fontSize,
    fontWeight: Typography.weight.extraBold,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs / 2,
  },
  fieldInput: {
    fontSize: Typography.bodyMD.fontSize,
    fontWeight: Typography.weight.semibold,
    padding: 0,
    margin: 0,
  },
  eyeBtn: {
    padding: Spacing.xs,
  },
});
