const NOTIFICATION_STORAGE_KEY = "@anki_notification_settings_v1";

export interface NotificationSettings {
  enabled: boolean;
  reminderTime: string; // e.g. "08:00"
}

class NotificationService {
  private settings: NotificationSettings = {
    enabled: true,
    reminderTime: "08:00",
  };
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
      if (raw) {
        try {
          this.settings = JSON.parse(raw);
        } catch {
          this.settings = { enabled: true, reminderTime: "08:00" };
        }
      }
    }
  }

  private persistSettings() {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(this.settings));
    }
  }

  public getSettings(): NotificationSettings {
    return this.settings;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public async toggleEnabled(enabled: boolean): Promise<NotificationSettings> {
    this.settings.enabled = enabled;
    this.persistSettings();
    this.notify();
    return this.settings;
  }

  public async setReminderTime(time: string): Promise<NotificationSettings> {
    this.settings.reminderTime = time;
    this.persistSettings();
    this.notify();
    return this.settings;
  }
}

export const notificationService = new NotificationService();
