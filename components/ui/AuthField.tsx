import React, { useState, useRef } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/theme";
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
  const inputRef = useRef<TextInput>(null);

  return (
    <Pressable onPress={() => inputRef.current?.focus()}>
      <DuolingoCard style={styles.fieldCard} padding={12}>
        <View style={styles.fieldRow}>
          <View style={styles.fieldIconWrap}>
            <Ionicons
              name={icon}
              size={20}
              color={focused ? Colors.duolingo.blue : Colors.duolingo.textMuted}
            />
          </View>
          <View style={styles.fieldBody}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <TextInput
              ref={inputRef}
              style={styles.fieldInput}
              placeholder={placeholder}
              placeholderTextColor={Colors.duolingo.disabledText}
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
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={showText ? "eye-off-outline" : "eye-outline"}
                size={18}
                color={Colors.duolingo.textMuted}
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
    backgroundColor: Colors.duolingo.bgSoftDark,
    borderColor: Colors.duolingo.cardBorder,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  fieldIconWrap: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldBody: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.duolingo.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  fieldInput: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    padding: 0,
    margin: 0,
  },
  eyeBtn: {
    padding: 4,
  },
});
