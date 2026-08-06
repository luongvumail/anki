import AsyncStorage from "@react-native-async-storage/async-storage";

const REVIEW_HISTORY_KEY = "@anki_review_history";

export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export class ReviewTrackerRepository {
  private cache: Record<string, number> | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  public async getReviewHistory(): Promise<Record<string, number>> {
    if (this.cache !== null) return this.cache;
    try {
      const json = await AsyncStorage.getItem(REVIEW_HISTORY_KEY);
      this.cache = json ? JSON.parse(json) : {};
      return this.cache!;
    } catch (e) {
      console.warn("[ReviewTrackerRepo] Error reading review history:", e);
      return {};
    }
  }

  public async recordReviewToday(): Promise<void> {
    try {
      const history = await this.getReviewHistory();
      const todayStr = getLocalDateString();
      history[todayStr] = (history[todayStr] || 0) + 1;
      this.cache = history;

      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(async () => {
        try {
          await AsyncStorage.setItem(REVIEW_HISTORY_KEY, JSON.stringify(this.cache));
        } catch (e) {
          console.warn("[ReviewTrackerRepo] Error saving review history:", e);
        }
      }, 2000);
    } catch (e) {
      console.warn("[ReviewTrackerRepo] Error recording review:", e);
    }
  }

  public async getStreakCount(): Promise<number> {
    try {
      const history = await this.getReviewHistory();
      let streak = 0;
      const today = new Date();

      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = getLocalDateString(d);
        if (history[dateStr] && history[dateStr] > 0) {
          streak++;
        } else {
          if (i === 0) continue;
          break;
        }
      }
      return streak;
    } catch {
      return 0;
    }
  }
}
