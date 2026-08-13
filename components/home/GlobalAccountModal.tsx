import React, { useState, useEffect } from "react";
import { Alert } from "react-native";
import { supabase } from "../../lib/supabase";
import { useStore } from "../../store/useStore";
import { cancelDailyStudyReminder } from "../../lib/notificationService";
import { AccountModal } from "./AccountModal";

export function GlobalAccountModal() {
  const isAccountModalOpen = useStore((s) => s.isAccountModalOpen);
  const closeAccountModal = useStore((s) => s.closeAccountModal);
  const resetUserState = useStore((s) => s.resetUserState);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(20);
  const [reminderMinute, setReminderMinute] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUserEmail(data.user.email || null);
        setUserName(
          data.user.user_metadata?.full_name ||
            (data.user.email ? data.user.email.split("@")[0] : "Bạn"),
        );
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
          resetUserState();
        },
      },
    ]);
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
      onSignOut={handleSignOut}
    />
  );
}
