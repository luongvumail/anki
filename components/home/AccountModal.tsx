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
import { Colors, Spacing, triggerHaptic } from "../../constants/theme";
import { FormField } from "../ui/FormField";
import { WheelTimePicker } from "./WheelTimePicker";
import { SectionTitle } from "../ui/SectionTitle";
import { DuolingoCard } from "../ui/DuolingoCard";
import { DuolingoButton } from "../ui/DuolingoButton";

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
      <View style={styles.modalContainer}>
        {/* Top App Header */}
        <View style={[styles.headerBar, { paddingTop: Math.max(insets.top + 8, 44) }]}>
          <Text style={styles.headerTitle}>TÀI KHOẢN &amp; CÀI ĐẶT</Text>

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => {
              triggerHaptic("selection");
              onClose();
            }}
          >
            <Ionicons name="close" size={24} color={Colors.duolingo.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* User Account Info Header */}
          <DuolingoCard style={styles.userInfoCard}>
            <View style={styles.userRow}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={32} color={Colors.duolingo.blue} />
              </View>
              <View style={styles.userTextCol}>
                <Text style={styles.userName}>{displayName || "Học viên Anki"}</Text>
                <Text style={styles.userEmail}>{email || "chua_cap_nhat@email.com"}</Text>
              </View>
            </View>
          </DuolingoCard>

          {/* Daily Reminder Settings Section */}
          <SectionTitle>NHẮC NHỞ HỌC TẬP HÀNG NGÀY</SectionTitle>
          <DuolingoCard style={styles.settingCard}>
            <View style={styles.reminderToggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.reminderTitle}>Thông báo nhắc ôn bài</Text>
                <Text style={styles.reminderSub}>Đẩy thông báo vào giờ đã chọn mỗi ngày</Text>
              </View>
              <Switch
                value={reminderEnabled}
                onValueChange={(val) => {
                  triggerHaptic("selection");
                  onToggleReminder(val);
                }}
                trackColor={{ false: Colors.duolingo.cardBottom, true: Colors.duolingo.green }}
                thumbColor="#FFFFFF"
              />
            </View>

            {reminderEnabled && (
              <View style={styles.pickerBox}>
                <Text style={styles.pickerLabel}>Chọn giờ nhắc học:</Text>
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
          <SectionTitle>BẢO MẬT &amp; MẬT KHẨU</SectionTitle>
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
              <Text style={styles.resetEmailText}>
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
    backgroundColor: Colors.duolingo.bg,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.pageMargin,
    paddingBottom: 12,
    backgroundColor: Colors.duolingo.bg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.duolingo.cardBorder,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.text.white,
  },
  closeBtn: {
    padding: 6,
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
    gap: 12,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.duolingo.blueDim,
    alignItems: "center",
    justifyContent: "center",
  },
  userTextCol: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text.white,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.duolingo.textMuted,
    marginTop: 2,
    fontWeight: "600",
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
    fontSize: 14,
    fontWeight: "800",
    color: Colors.text.white,
  },
  reminderSub: {
    fontSize: 12,
    color: Colors.duolingo.textMuted,
    marginTop: 2,
    fontWeight: "600",
  },
  pickerBox: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.duolingo.cardBorder,
  },
  pickerLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.duolingo.textMuted,
    marginBottom: 8,
  },
  resetEmailBtn: {
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 8,
  },
  resetEmailText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.duolingo.blue,
  },
});
