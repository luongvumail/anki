import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { getAuthErrorMessage } from "../lib/errorHandler";
import { Spacing, Radii, Typography, Layout, BorderWidths, triggerHaptic } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { DuolingoButton } from "../components/ui/DuolingoButton";
import { AuthField } from "../components/ui/AuthField";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      triggerHaptic("warning");
      Alert.alert("Thông báo", "Vui lòng nhập địa chỉ email và mật khẩu.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        triggerHaptic("success");
      } else {
        if (!name.trim()) {
          triggerHaptic("warning");
          Alert.alert("Thông báo", "Vui lòng nhập họ tên của bạn.");
          setLoading(false);
          return;
        }
        const cred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        await updateProfile(cred.user, { displayName: name.trim() });
        triggerHaptic("success");
      }
    } catch (e: unknown) {
      triggerHaptic("error");
      Alert.alert("Lỗi xác thực", getAuthErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      triggerHaptic("warning");
      Alert.alert(
        "Quên mật khẩu",
        'Vui lòng nhập địa chỉ email của bạn vào ô Email rồi bấm lại "Quên mật khẩu?".'
      );
      return;
    }
    setResettingPassword(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      triggerHaptic("success");
      Alert.alert(
        "Đã gửi email khôi phục",
        `Hướng dẫn đặt lại mật khẩu đã được gửi tới ${email.trim()}.\nVui lòng mở hộp thư để đặt lại mật khẩu.`
      );
    } catch (e: unknown) {
      triggerHaptic("error");
      Alert.alert("Không thể gửi email", getAuthErrorMessage(e));
    } finally {
      setResettingPassword(false);
    }
  };

  const toggleMode = (newMode: "login" | "register") => {
    triggerHaptic("selection");
    setMode(newMode);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: Math.max(insets.top + Spacing.lg, 64),
            paddingBottom: Math.max(insets.bottom + Spacing.lg, 48),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header / Branding */}
        <View style={styles.header}>
          <View style={styles.appIconBox}>
            <Image
              source={require("../assets/images/mascot.png")}
              style={styles.appIconImage}
              resizeMode="contain"
            />
          </View>

          <Text style={[styles.appName, { color: theme.textPrimary }]}>Anki Chinese</Text>
          <Text style={[styles.tagline, { color: theme.textMuted }]}>
            HỌC TIẾNG TRUNG THEO PHƯƠNG PHÁP SRS
          </Text>
        </View>

        {/* Mode Switcher */}
        <View style={[styles.segmentedControl, { backgroundColor: theme.bgSoft, borderBottomColor: theme.cardBottom }]}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              mode === "login" && { backgroundColor: theme.cardBg },
            ]}
            onPress={() => toggleMode("login")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentText,
                { color: mode === "login" ? theme.textPrimary : theme.textMuted },
              ]}
            >
              Đăng nhập
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              mode === "register" && { backgroundColor: theme.cardBg },
            ]}
            onPress={() => toggleMode("register")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentText,
                { color: mode === "register" ? theme.textPrimary : theme.textMuted },
              ]}
            >
              Đăng ký
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formGroup}>
          {mode === "register" && (
            <AuthField
              label="HỌ TÊN"
              icon="person-outline"
              placeholder="Họ và tên của bạn"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          )}

          <AuthField
            label="EMAIL"
            icon="mail-outline"
            placeholder="Địa chỉ email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <AuthField
            label="MẬT KHẨU"
            icon="lock-closed-outline"
            placeholder="Mật khẩu"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {/* Forgot Password link */}
        {mode === "login" && (
          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={handleForgotPassword}
            disabled={resettingPassword}
          >
            <Text style={[styles.forgotBtnText, { color: theme.blue }]}>
              {resettingPassword ? "Đang gửi..." : "Quên mật khẩu?"}
            </Text>
          </TouchableOpacity>
        )}

        {/* 3D Primary Button */}
        <DuolingoButton
          title={loading ? "ĐANG XỬ LÝ..." : mode === "login" ? "ĐĂNG NHẬP" : "TẠO TÀI KHOẢN"}
          icon={loading ? undefined : <Ionicons name={mode === "login" ? "log-in" : "person-add"} size={Layout.iconMd} color="#FFFFFF" />}
          variant="primary"
          size="lg"
          disabled={loading}
          onPress={handleSubmit}
          style={{ marginTop: Spacing.md }}
        />

        {/* Footer Toggle */}
        <View style={styles.footerToggle}>
          <Text style={[styles.footerText, { color: theme.textMuted }]}>
            {mode === "login" ? "Chưa có tài khoản?" : "Đã có tài khoản?"}
          </Text>
          <TouchableOpacity
            onPress={() => toggleMode(mode === "login" ? "register" : "login")}
            hitSlop={Layout.hitSlopSm}
          >
            <Text style={[styles.footerLink, { color: theme.blue }]}>
              {mode === "login" ? " Tạo ngay" : " Đăng nhập"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.pageMargin,
  },

  header: { alignItems: "center", marginBottom: Spacing.xl },
  appIconBox: {
    width: Layout.avatarXl,
    height: Layout.avatarXl,
    borderRadius: Radii.xl,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  appIconImage: { width: Layout.avatarXl, height: Layout.avatarXl },
  appName: {
    fontSize: Typography.titleLG.fontSize,
    fontWeight: Typography.weight.extraBold,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: Typography.text.caption2.fontSize,
    textAlign: "center",
    marginTop: Spacing.xs,
    letterSpacing: 1,
    fontWeight: Typography.weight.bold,
  },

  segmentedControl: {
    flexDirection: "row",
    borderRadius: Radii.lg,
    padding: Spacing.xs,
    marginBottom: Spacing.lg,
    borderBottomWidth: BorderWidths.card3D,
  },
  segmentBtn: {
    flex: 1,
    height: Layout.btnHeightMd,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radii.md,
  },
  segmentText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.weight.bold,
  },

  formGroup: {
    gap: Spacing.cellPadding,
    marginBottom: Spacing.md,
  },

  forgotBtn: {
    alignSelf: "flex-end",
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  forgotBtnText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.weight.bold,
    textDecorationLine: "underline",
  },

  footerToggle: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  footerText: {
    fontSize: Typography.caption1.fontSize,
  },
  footerLink: {
    fontSize: Typography.caption1.fontSize,
    fontWeight: Typography.weight.extraBold,
    textDecorationLine: "underline",
  },
});
