import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Spacing, Typography, Layout, BorderWidths, triggerHaptic } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { FormField } from "../ui/FormField";
import { WheelTimePicker } from "./WheelTimePicker";
import { SectionTitle } from "../ui/SectionTitle";
import { DuolingoCard } from "../ui/DuolingoCard";
import { DuolingoButton } from "../ui/DuolingoButton";
import { ThemeSwitcher } from "../ui/ThemeSwitcher";

interface AccountModalProps {
  visible: boolean;
  onClose: () => void;
  displayName: string;
  email: string | null;
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  onToggleReminder: (value: boolean) => void;
  onHourChange: (hour: number) => void;
  onMinuteChange: (minute: number) => void;
  onChangePassword: (curr: string, next: string) => Promise<void>;
  onSendResetEmail: () => Promise<void>;
  onSignOut: () => void;
}

export function AccountModal({
  visible,
  onClose,
  displayName,
  email,
  reminderEnabled,
  reminderHour,
  reminderMinute,
  onToggleReminder,
  onHourChange,
  onMinuteChange,
  onChangePassword,
  onSendResetEmail,
  onSignOut,
}: AccountModalProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loadingPass, setLoadingPass] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);

  const handlePasswordSubmit = async () => {
    if (!newPassword) return;
    if (newPassword.length < 6) {
      Alert.alert("Thông báo", "Mật khẩu mới phải chứa ít nhất 6 ký tự.");
      return;
    }
    setLoadingPass(true);
    try {
      await onChangePassword(currentPassword, newPassword);
      Alert.alert("Thành công", "Đã cập nhật mật khẩu mới!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert("Lỗi đổi mật khẩu", msg || "Không thể cập nhật mật khẩu.");
    } finally {
      setLoadingPass(false);
    }
  };

  const handleResetSubmit = async () => {
    setLoadingReset(true);
    try {
      await onSendResetEmail();
      Alert.alert(
        "Đã gửi email khôi phục",
        "Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn.",
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert("Không thể gửi email", msg || "Vui lòng thử lại sau.");
    } finally {
      setLoadingReset(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.bg }]}>
        {/* Top App Header */}
        <View style={[styles.headerBar, { paddingTop: Math.max(insets.top + Spacing.sm, Spacing.cellMinHeight), backgroundColor: theme.bg, borderBottomColor: theme.cardBorder }]}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>TÀI KHOẢN & CÀI ĐẶT</Text>

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => {
              triggerHaptic("selection");
              onClose();
            }}
          >
            <Ionicons name="close" size={Layout.iconLg} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* User Account Info Header */}
          <DuolingoCard style={styles.userInfoCard}>
            <View style={styles.userRow}>
              <View style={[styles.avatarCircle, { backgroundColor: theme.blueDim }]}>
                <Ionicons name="person" size={Layout.iconXl} color={theme.blue} />
              </View>
              <View style={styles.userTextCol}>
                <Text style={[styles.userName, { color: theme.textPrimary }]}>{displayName || "Học viên Anki"}</Text>
                <Text style={[styles.userEmail, { color: theme.textMuted }]}>{email || "chua_cap_nhat@email.com"}</Text>
              </View>
            </View>
          </DuolingoCard>

          {/* Theme Settings Section */}
          <SectionTitle>GIAO DIỆN</SectionTitle>
          <DuolingoCard style={styles.settingCard}>
            <ThemeSwitcher />
          </DuolingoCard>

          {/* Daily Reminder Settings Section */}
          <SectionTitle>NHẮC NHỞ HỌC TẬP</SectionTitle>
          <DuolingoCard style={styles.settingCard}>
            <View style={styles.reminderToggleRow}>
              <Text style={[styles.reminderTitle, { color: theme.textPrimary }]}>Thông báo mỗi ngày</Text>
              <Switch
                value={reminderEnabled}
                onValueChange={(val) => {
                  triggerHaptic("selection");
                  onToggleReminder(val);
                }}
                trackColor={{ false: theme.bgSoft, true: theme.green }}
                thumbColor="#FFFFFF"
              />
            </View>

            {reminderEnabled && (
              <View style={styles.pickerBox}>
                <WheelTimePicker
                  hour={reminderHour}
                  minute={reminderMinute}
                  onHourChange={onHourChange}
                  onMinuteChange={onMinuteChange}
                />
              </View>
            )}
          </DuolingoCard>

          {/* Account Security Section */}
          <SectionTitle>BẢO MẬT & MẬT KHẨU</SectionTitle>
          <DuolingoCard style={styles.settingCard}>
            <FormField
              label="Mật khẩu hiện tại"
              placeholder="••••••••"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />

            <FormField
              label="Mật khẩu mới (ít nhất 6 ký tự)"
              placeholder="••••••••"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

            <DuolingoButton
              title={loadingPass ? "ĐANG ĐỔI..." : "ĐỔI MẬT KHẨU"}
              variant="primary"
              size="md"
              disabled={loadingPass || !newPassword}
              onPress={handlePasswordSubmit}
              style={{ marginTop: Spacing.sm }}
            />

            <TouchableOpacity style={styles.resetEmailBtn} onPress={handleResetSubmit} disabled={loadingReset}>
              <Text style={[styles.resetEmailText, { color: theme.blue }]}>
                {loadingReset ? "Đang gửi..." : "Gửi email đặt lại mật khẩu"}
              </Text>
            </TouchableOpacity>
          </DuolingoCard>

          {/* Sign Out Action */}
          <DuolingoButton
            title="ĐĂNG XUẤT TÀI KHOẢN"
            variant="error"
            size="lg"
            onPress={() => {
              triggerHaptic("heavy");
              onSignOut();
              onClose();
            }}
            style={{ marginTop: Spacing.xl, marginBottom: Spacing.xl }}
          />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.pageMargin,
    paddingBottom: Spacing.md,
    borderBottomWidth: BorderWidths.thin,
  },
  headerTitle: {
    fontSize: Typography.callout.fontSize,
    fontWeight: Typography.weight.extraBold,
  },
  closeBtn: {
    padding: Spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: Spacing.pageMargin,
    paddingTop: Spacing.md,
  },
  userInfoCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  avatarCircle: {
    width: Layout.fabSize,
    height: Layout.fabSize,
    borderRadius: Layout.fabSize / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  userTextCol: {
    flex: 1,
  },
  userName: {
    fontSize: Typography.titleMD.fontSize,
    fontWeight: Typography.weight.extraBold,
  },
  userEmail: {
    fontSize: Typography.caption.fontSize,
    marginTop: 2,
    fontWeight: Typography.weight.semibold,
  },
  settingCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  reminderToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reminderTitle: {
    fontSize: Typography.subhead.fontSize,
    fontWeight: Typography.weight.extraBold,
  },
  reminderSub: {
    fontSize: Typography.caption1.fontSize,
    marginTop: 2,
    fontWeight: Typography.weight.semibold,
  },
  pickerBox: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: BorderWidths.thin,
  },
  pickerLabel: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.sm,
  },
  resetEmailBtn: {
    alignItems: "center",
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  resetEmailText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.weight.bold,
  },
});
