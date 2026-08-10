import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { authService } from "../../infrastructure/auth/authService.js";
import { theme } from "../theme/theme.js";
import { useTheme } from "../theme/ThemeContext.js";
import { DuolingoButton } from "../components/DuolingoButton.js";
import { DuolingoCard } from "../components/DuolingoCard.js";
import { Icon } from "../components/Icon.js";

export interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export type AuthMode = "LOGIN" | "REGISTER" | "FORGOT_PASSWORD";

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const { theme: activeTheme } = useTheme();
  const [authMode, setAuthMode] = useState<AuthMode>("LOGIN");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const clearErrors = () => {
    setEmailError(null);
    setPasswordError(null);
    setGeneralError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async () => {
    clearErrors();
    let hasError = false;

    if (!email.trim()) {
      setEmailError("Vui lòng nhập Email tài khoản.");
      hasError = true;
    } else if (!email.includes("@")) {
      setEmailError("Email không đúng định dạng chuẩn.");
      hasError = true;
    }

    if (authMode !== "FORGOT_PASSWORD") {
      if (!password.trim() || password.length < 6) {
        setPasswordError("Mật khẩu phải có ít nhất 6 ký tự.");
        hasError = true;
      }
    }

    if (hasError) return;

    setLoading(true);
    try {
      if (authMode === "FORGOT_PASSWORD") {
        await authService.resetPassword(email.trim());
        setSuccessMessage(`Đã gửi link khôi phục mật khẩu tới email: ${email.trim()}`);
      } else if (authMode === "LOGIN") {
        await authService.login(email.trim(), password);
        onAuthSuccess();
      } else {
        await authService.register(email.trim(), password);
        onAuthSuccess();
      }
    } catch (e: any) {
      setGeneralError(e?.message || "Không thể kết nối dịch vụ xác thực. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: activeTheme.colors.bg }]}>
      <View style={styles.content}>
        {/* Brand Header */}
        <View style={styles.brandBox}>
          <Icon name="brain" size={64} color={activeTheme.colors.primary} />
          <Text style={[styles.brandTitle, { color: activeTheme.colors.primary }]}>
            ANKI HÁN NGỮ
          </Text>
          <Text style={[styles.brandSubtitle, { color: activeTheme.colors.textSecondary }]}>
            Hệ thống học từ vựng tiếng Trung ứng dụng FSRS v5 & AI
          </Text>
        </View>

        <DuolingoCard accessibilityLabel="Màn hình xác thực">
          {/* Mode Switch Tabs */}
          {authMode !== "FORGOT_PASSWORD" ? (
            <View style={styles.tabRow}>
              <Pressable
                onPress={() => {
                  setAuthMode("LOGIN");
                  clearErrors();
                }}
                style={[
                  styles.tabBtn,
                  {
                    backgroundColor: activeTheme.colors.cardBg,
                    borderColor: activeTheme.colors.cardBorder,
                  },
                  authMode === "LOGIN" && {
                    backgroundColor: activeTheme.colors.primary,
                    borderColor: activeTheme.colors.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color:
                        authMode === "LOGIN"
                          ? activeTheme.colors.white
                          : activeTheme.colors.textSecondary,
                    },
                  ]}
                >
                  ĐĂNG NHẬP
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setAuthMode("REGISTER");
                  clearErrors();
                }}
                style={[
                  styles.tabBtn,
                  {
                    backgroundColor: activeTheme.colors.cardBg,
                    borderColor: activeTheme.colors.cardBorder,
                  },
                  authMode === "REGISTER" && {
                    backgroundColor: activeTheme.colors.primary,
                    borderColor: activeTheme.colors.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color:
                        authMode === "REGISTER"
                          ? activeTheme.colors.white
                          : activeTheme.colors.textSecondary,
                    },
                  ]}
                >
                  ĐĂNG KÝ
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.forgotHeader}>
              <Pressable
                onPress={() => {
                  setAuthMode("LOGIN");
                  clearErrors();
                }}
                style={styles.backLink}
              >
                <Text style={[styles.backLinkText, { color: activeTheme.colors.primary }]}>
                  ← Quay lại Đăng Nhập
                </Text>
              </Pressable>
              <Text style={[styles.forgotTitle, { color: activeTheme.colors.textPrimary }]}>
                KHÔI PHỤC MẬT KHẨU
              </Text>
            </View>
          )}

          {/* Form Inputs */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: activeTheme.colors.textSecondary }]}>
              EMAIL TÀI KHOẢN *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: activeTheme.colors.cardBg,
                  borderColor: emailError
                    ? activeTheme.colors.danger
                    : activeTheme.colors.cardBorder,
                  color: activeTheme.colors.textPrimary,
                },
              ]}
              placeholder="nhapemail@example.com"
              placeholderTextColor={activeTheme.colors.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(txt) => {
                setEmail(txt);
                if (emailError) setEmailError(null);
              }}
            />
            {emailError && (
              <Text style={[styles.fieldErrorText, { color: activeTheme.colors.danger }]}>
                {emailError}
              </Text>
            )}
          </View>

          {authMode !== "FORGOT_PASSWORD" && (
            <View style={styles.formGroup}>
              <View style={styles.passwordLabelRow}>
                <Text style={[styles.label, { color: activeTheme.colors.textSecondary }]}>
                  MẬT KHẨU *
                </Text>
                {authMode === "LOGIN" && (
                  <Pressable
                    onPress={() => {
                      setAuthMode("FORGOT_PASSWORD");
                      clearErrors();
                    }}
                  >
                    <Text style={[styles.forgotLinkText, { color: activeTheme.colors.primary }]}>
                      Quên mật khẩu?
                    </Text>
                  </Pressable>
                )}
              </View>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: activeTheme.colors.cardBg,
                    borderColor: passwordError
                      ? activeTheme.colors.danger
                      : activeTheme.colors.cardBorder,
                    color: activeTheme.colors.textPrimary,
                  },
                ]}
                placeholder="••••••••"
                placeholderTextColor={activeTheme.colors.textLight}
                secureTextEntry
                value={password}
                onChangeText={(txt) => {
                  setPassword(txt);
                  if (passwordError) setPasswordError(null);
                }}
              />
              {passwordError && (
                <Text style={[styles.fieldErrorText, { color: activeTheme.colors.danger }]}>
                  {passwordError}
                </Text>
              )}
            </View>
          )}

          {/* General Error or Success Banner */}
          {generalError && (
            <View
              style={[
                styles.bannerBox,
                {
                  backgroundColor: activeTheme.badges.due.bg,
                  borderColor: activeTheme.colors.danger,
                },
              ]}
            >
              <Icon name="wrench" size={18} color={activeTheme.colors.danger} />
              <Text style={[styles.bannerText, { color: activeTheme.colors.danger }]}>
                {generalError}
              </Text>
            </View>
          )}

          {successMessage && (
            <View
              style={[
                styles.bannerBox,
                {
                  backgroundColor: activeTheme.badges.learned.bg,
                  borderColor: activeTheme.colors.primary,
                },
              ]}
            >
              <Icon name="check" size={18} color={activeTheme.colors.primary} />
              <Text style={[styles.bannerText, { color: activeTheme.colors.primary }]}>
                {successMessage}
              </Text>
            </View>
          )}

          <View style={styles.btnSection}>
            <DuolingoButton
              title={
                loading
                  ? "ĐANG XỬ LÝ..."
                  : authMode === "FORGOT_PASSWORD"
                    ? "GỬI LINK KHÔI PHỤC MẬT KHẨU"
                    : authMode === "LOGIN"
                      ? "ĐĂNG NHẬP NGAY"
                      : "TẠO TÀI KHOẢN MỚI"
              }
              variant="primary"
              disabled={loading}
              onPress={handleSubmit}
            />
          </View>
        </DuolingoCard>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  content: {
    width: "100%",
    maxWidth: 420,
  },
  brandBox: {
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  brandTitle: {
    fontSize: theme.fontSize.title,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.primary,
    marginTop: theme.spacing.sm,
  },
  brandSubtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: theme.spacing.xs,
  },
  tabRow: {
    flexDirection: "row",
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: "center",
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.cardBg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  tabBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tabText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: theme.colors.white,
  },
  forgotHeader: {
    marginBottom: theme.spacing.lg,
  },
  backLink: {
    marginBottom: theme.spacing.xs,
  },
  backLinkText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },
  forgotTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  formGroup: {
    marginBottom: theme.spacing.md,
  },
  passwordLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  forgotLinkText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },
  label: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.cardBg,
    borderColor: theme.colors.cardBorder,
    borderWidth: 2,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.base,
    color: theme.colors.textPrimary,
  },
  fieldErrorText: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  bannerBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: theme.spacing.md,
  },
  bannerText: {
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  btnSection: {
    marginTop: theme.spacing.sm,
  },
  guestSection: {
    marginTop: theme.spacing.lg,
  },
});
