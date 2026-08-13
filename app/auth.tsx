import React, { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { signInWithGoogle } from "../lib/supabase";
import { getAuthErrorMessage } from "../lib/errorHandler";
import { Spacing, Typography, Radii, triggerHaptic } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { SocialAuthButton } from "../components/ui/SocialAuthButton";
import { AppMascot } from "../components/ui/AppMascot";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      triggerHaptic("success");
    } catch (e: unknown) {
      triggerHaptic("error");
      Alert.alert("Đăng nhập thất bại", getAuthErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View
        style={[
          styles.centeredCard,
          {
            backgroundColor: theme.cardBg,
            borderColor: theme.cardBorder,
            marginTop: insets.top > 0 ? insets.top : Spacing.xl,
            marginBottom: insets.bottom > 0 ? insets.bottom : Spacing.xl,
          },
        ]}
      >
        {/* Branding Header */}
        <View style={styles.header}>
          <View style={styles.mascotWrapper}>
            <AppMascot size={112} useAppLogo />
          </View>

          <Text style={[styles.appName, { color: theme.textPrimary }]}>Anki</Text>
          <Text style={[styles.tagline, { color: theme.textMuted }]}>
            HỌC TIẾNG TRUNG THEO PHƯƠNG PHÁP FSRS (Free Spaced Repetition Scheduler) & AI
          </Text>
        </View>

        {/* Primary Action Button: Google Sign-In */}
        <View style={styles.actionSection}>
          <SocialAuthButton
            provider="google"
            onPress={handleGoogleSignIn}
            loading={loading}
            disabled={loading}
          />
        </View>

        {/* Terms & Privacy Note */}
        <View style={styles.footer}>
          <Text style={[styles.disclaimer, { color: theme.textMuted }]}>
            Bằng việc đăng nhập, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của Anki.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.pageMargin,
  },
  centeredCard: {
    width: "100%",
    maxWidth: 400,
    borderRadius: Radii.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },

  header: {
    alignItems: "center",
    marginBottom: Spacing.xxl,
  },
  mascotWrapper: {
    marginBottom: Spacing.md,
  },
  appName: {
    fontSize: Typography.title1.fontSize,
    fontWeight: Typography.weight.extraBold,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: Typography.text.caption2.fontSize,
    textAlign: "center",
    marginTop: Spacing.xs,
    letterSpacing: 1.2,
    fontWeight: Typography.weight.bold,
  },

  actionSection: {
    width: "100%",
    marginBottom: Spacing.xl,
  },
  footer: {
    width: "100%",
    alignItems: "center",
  },
  disclaimer: {
    fontSize: Typography.caption1.fontSize,
    textAlign: "center",
    lineHeight: 18,
  },
});
