import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useStore } from "../store/useStore";
import {
  getReminderSettings,
  saveReminderSettings,
  ReminderSettings,
} from "../lib/notificationService";

export function useAccountSettings() {
  const resetUserState = useStore((s) => s.resetUserState);
  const [currentUser, setCurrentUser] = useState<{ email?: string; id?: string } | null>(null);

  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    enabled: false,
    hour: 20,
    minute: 0,
  });

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

  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      resetUserState();
    } catch (err) {
      console.warn("[useAccountSettings] Sign out failed:", err);
    }
  }, [resetUserState]);

  return {
    currentUser,
    reminderSettings,
    handleToggleReminder,
    handleHourChange,
    handleMinuteChange,
    handleSignOut,
  };
}
