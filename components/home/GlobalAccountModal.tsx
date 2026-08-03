import React, { useState } from "react";
import { Alert } from "react-native";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useStore } from "../../store/useStore";
import { getAuthErrorMessage } from "../../lib/errorHandler";
import { cancelDailyStudyReminder } from "../../lib/notificationService";
import { AccountModal } from "./AccountModal";

export function GlobalAccountModal() {
  const isAccountModalOpen = useStore((s) => s.isAccountModalOpen);
  const closeAccountModal = useStore((s) => s.closeAccountModal);
  const user = auth.currentUser;

  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(20);
  const [reminderMinute, setReminderMinute] = useState(0);

  const displayName = user?.displayName || (user?.email ? user.email.split("@")[0] : "Bạn");
  const email = user?.email || null;

  const handleToggleReminder = async (val: boolean) => {
    setReminderEnabled(val);
    if (!val) {
      await cancelDailyStudyReminder();
    }
  };

  const handleSignOut = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất tài khoản?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          closeAccountModal();
          await auth.signOut();
          useStore.setState({ decks: [], cards: {}, session: null, userId: null });
        },
      },
    ]);
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    if (!user || !user.email) return;
    if (!newPassword || newPassword.length < 6) {
      Alert.alert("Thông báo", "Mật khẩu mới cần ít nhất 6 ký tự");
      return;
    }

    try {
      if (currentPassword) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
      }
      await updatePassword(user, newPassword);
      Alert.alert("Thành công", "Mật khẩu của bạn đã được cập nhật thành công!");
    } catch (e: any) {
      Alert.alert("Đổi mật khẩu thất bại", getAuthErrorMessage(e));
      throw e;
    }
  };

  const handleSendResetEmail = async () => {
    if (!user || !user.email) return;
    Alert.alert("Thành công", "Đã gửi email khôi phục mật khẩu.");
  };

  if (!isAccountModalOpen) return null;

  return (
    <AccountModal
      visible={isAccountModalOpen}
      onClose={closeAccountModal}
      displayName={displayName}
      email={email}
      reminderEnabled={reminderEnabled}
      reminderHour={reminderHour}
      reminderMinute={reminderMinute}
      onToggleReminder={handleToggleReminder}
      onHourChange={setReminderHour}
      onMinuteChange={setReminderMinute}
      onChangePassword={handleChangePassword}
      onSendResetEmail={handleSendResetEmail}
      onSignOut={handleSignOut}
    />
  );
}
