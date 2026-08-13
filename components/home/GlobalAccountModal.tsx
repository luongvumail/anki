import React, { useState, useEffect } from "react";
import { Alert } from "react-native";
import { supabase } from "../../lib/supabase";
import { useStore } from "../../store/useStore";
import { getAuthErrorMessage } from "../../lib/errorHandler";
import { cancelDailyStudyReminder } from "../../lib/notificationService";
import { AccountModal } from "./AccountModal";

export function GlobalAccountModal() {
  const isAccountModalOpen = useStore((s) => s.isAccountModalOpen);
  const closeAccountModal = useStore((s) => s.closeAccountModal);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(20);
  const [reminderMinute, setReminderMinute] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUserEmail(data.user.email || null);
        setUserName(data.user.user_metadata?.full_name || (data.user.email ? data.user.email.split("@")[0] : "Bạn"));
      }
    });
  }, [isAccountModalOpen]);

  const displayName = userName || (userEmail ? userEmail.split("@")[0] : "Bạn");
  const email = userEmail;

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
          await supabase.auth.signOut();
          useStore.setState({ decks: [], cards: {}, session: null, userId: null });
        },
      },
    ]);
  };

  const handleChangePassword = async (_currentPassword: string, newPassword: string) => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert("Thông báo", "Mật khẩu mới cần ít nhất 6 ký tự");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      Alert.alert("Thành công", "Mật khẩu của bạn đã được cập nhật thành công!");
    } catch (e: any) {
      Alert.alert("Đổi mật khẩu thất bại", getAuthErrorMessage(e));
      throw e;
    }
  };

  const handleSendResetEmail = async () => {
    if (!userEmail) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail);
      if (error) throw error;
      Alert.alert("Thành công", "Đã gửi email khôi phục mật khẩu.");
    } catch (e: any) {
      Alert.alert("Gửi email thất bại", getAuthErrorMessage(e));
    }
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
