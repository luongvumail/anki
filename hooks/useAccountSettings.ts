import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useStore } from "../store/useStore";
import {
  getReminderSettings,
  saveReminderSettings,
  ReminderSettings,
} from "../lib/notificationService";

export function useAccountSettings() {
  const setUserId = useStore((s) => s.setUserId);
  const [currentUser, setCurrentUser] = useState<{ email?: string; id?: string } | null>(null);

  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    enabled: false,
    hour: 20,
    minute: 0,
  });

  const [loadingPass, setLoadingPass] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);

  useEffect(() => {
    getReminderSettings().then(setReminderSettings);

    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUser({ email: data.user.email, id: data.user.id });
      }
    });
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

  const handleChangePassword = useCallback(
    async (_currentPass: string, newPass: string) => {
      setLoadingPass(true);
      try {
        const { error } = await supabase.auth.updateUser({ password: newPass });
        if (error) throw error;
      } finally {
        setLoadingPass(false);
      }
    },
    [],
  );

  const handleSendResetEmail = useCallback(async () => {
    if (!currentUser?.email) throw new Error("Không tìm thấy địa chỉ email");
    setLoadingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(currentUser.email);
      if (error) throw error;
    } finally {
      setLoadingReset(false);
    }
  }, [currentUser]);

  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
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
