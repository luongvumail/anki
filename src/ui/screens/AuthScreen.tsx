import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { authService } from "../../infrastructure/auth/authService.js";
import { theme } from "../theme/theme.js";
import { DuolingoButton } from "../components/DuolingoButton.js";
import { DuolingoCard } from "../components/DuolingoCard.js";
import { Icon } from "../components/Icon.js";

export interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export type AuthMode = "LOGIN" | "REGISTER" | "FORGOT_PASSWORD";

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [authMode, setAuthMode] = useState<AuthMode>("LOGIN");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage("Vui lòng nhập Email.");
      return;
    }

    if (!email.includes("@")) {
      setErrorMessage("Email không đúng định dạng.");
      return;
    }

    if (authMode === "FORGOT_PASSWORD") {
      setLoading(true);
      try {
        await authService.resetPassword(email.trim());
        setSuccessMessage(`Đã gửi link khôi phục mật khẩu tới email: ${email.trim()}`);
      } catch (e: any) {
        setErrorMessage(e.message || "Không thể gửi email khôi phục. Vui lòng thử lại!");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password.trim() || password.length < 6) {
      setErrorMessage("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setLoading(true);
    try {
      if (authMode === "LOGIN") {
        await authService.login(email.trim(), password);
      } else {
        await authService.register(email.trim(), password);
      }
      onAuthSuccess();
    } catch {
      setErrorMessage("Không thể kết nối dịch vụ xác thực. Thử lại sau!");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    await authService.loginAsGuest();
    onAuthSuccess();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Brand Header */}
        <View style={styles.brandBox}>
          <Icon name="brain" size={64} color={theme.colors.primary} />
          <Text style={styles.brandTitle}>ANKI HÁN NGỮ</Text>
          <Text style={styles.brandSubtitle}>
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
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                style={[styles.tabBtn, authMode === "LOGIN" && styles.tabBtnActive]}
              >
                <Text style={[styles.tabText, authMode === "LOGIN" && styles.tabTextActive]}>
                  ĐĂNG NHẬP
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setAuthMode("REGISTER");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                style={[styles.tabBtn, authMode === "REGISTER" && styles.tabBtnActive]}
              >
                <Text style={[styles.tabText, authMode === "REGISTER" && styles.tabTextActive]}>
                  ĐĂNG KÝ
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.forgotHeader}>
              <Pressable
                onPress={() => {
                  setAuthMode("LOGIN");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                style={styles.backLink}
              >
                <Text style={styles.backLinkText}>← Quay lại Đăng Nhập</Text>
              </Pressable>
              <Text style={styles.forgotTitle}>KHÔI PHỤC MẬT KHẨU</Text>
            </View>
          )}

          {/* Form Inputs */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>EMAIL TÀI KHOẢN *</Text>
            <TextInput
              style={styles.input}
              placeholder="nhapemail@example.com"
              placeholderTextColor={theme.colors.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {authMode !== "FORGOT_PASSWORD" && (
            <View style={styles.formGroup}>
              <View style={styles.passwordLabelRow}>
                <Text style={styles.label}>MẬT KHẨU *</Text>
                {authMode === "LOGIN" && (
                  <Pressable
                    onPress={() => {
                      setAuthMode("FORGOT_PASSWORD");
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                  >
                    <Text style={styles.forgotLinkText}>Quên mật khẩu?</Text>
                  </Pressable>
                )}
              </View>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={theme.colors.textLight}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          )}

          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {successMessage && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{successMessage}</Text>
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

        {/* Guest Mode Button */}
        <View style={styles.guestSection}>
          <DuolingoButton
            title="🚀 TRẢI NGHIỆM NGAY (KHÔNG CẦN TÀI KHOẢN)"
            variant="secondary"
            onPress={handleGuestLogin}
          />
        </View>
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
  errorBox: {
    backgroundColor: theme.badges.due.bg,
    borderColor: theme.colors.danger,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  successBox: {
    backgroundColor: theme.badges.learned.bg,
    borderColor: theme.colors.primary,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  successText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  btnSection: {
    marginTop: theme.spacing.sm,
  },
  guestSection: {
    marginTop: theme.spacing.lg,
  },
});
