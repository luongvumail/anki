import { useState, useEffect, useCallback } from "react";
import { updatePassword, sendPasswordResetEmail, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useStore } from "../store/useStore";
import {
  getReminderSettings,
  saveReminderSettings,
  ReminderSettings,
} from "../lib/notificationService";

export function useAccountSettings() {
  const userId = useStore((s) => s.userId);
  const setUserId = useStore((s) => s.setUserId);
  const currentUser = auth.currentUser;

  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    enabled: false,
    hour: 20,
    minute: 0,
  });

  const [loadingPass, setLoadingPass] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);

  useEffect(() => {
    getReminderSettings().then(setReminderSettings);
  }, []);

  const handleToggleReminder = useCallback(async (enabled: boolean) => {
    setReminderSettings((prev) => {
      const updated = { ...prev, enabled };
      saveReminderSettings(updated);
      return updated;
    });
  }, []);

  const handleHourChange = useCallback(async (hour: number) => {
    setReminderSettings((prev) => {
      const updated = { ...prev, hour };
      saveReminderSettings(updated);
      return updated;
    });
  }, []);

  const handleMinuteChange = useCallback(async (minute: number) => {
    setReminderSettings((prev) => {
      const updated = { ...prev, minute };
      saveReminderSettings(updated);
      return updated;
    });
  }, []);

  const handleChangePassword = useCallback(async (currentPass: string, newPass: string) => {
    if (!currentUser) throw new Error("Chưa đăng nhập");
    setLoadingPass(true);
    try {
      await updatePassword(currentUser, newPass);
    } finally {
      setLoadingPass(false);
    }
  }, [currentUser]);

  const handleSendResetEmail = useCallback(async () => {
    if (!currentUser?.email) throw new Error("Không tìm thấy địa chỉ email");
    setLoadingReset(true);
    try {
      await sendPasswordResetEmail(auth, currentUser.email);
    } finally {
      setLoadingReset(false);
    }
  }, [currentUser]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut(auth);
      setUserId(null);
    } catch (err) {
      console.warn("[useAccountSettings] Sign out failed:", err);
    }
  }, [setUserId]);

  return {
    currentUser,
    reminderSettings,
    loadingPass,
    loadingReset,
    handleToggleReminder,
    handleHourChange,
    handleMinuteChange,
    handleChangePassword,
    handleSendResetEmail,
    handleSignOut,
  };
}
