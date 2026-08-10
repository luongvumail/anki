export interface DailyReviewLog {
  date: string; // YYYY-MM-DD
  count: number;
  xpEarned: number;
}

const REVIEW_TRACKER_KEY = "@anki_review_tracker_v1";

export class ReviewTrackerRepository {
  private logs: Map<string, DailyReviewLog> = new Map();

  constructor() {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(REVIEW_TRACKER_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DailyReviewLog[];
        for (const item of parsed) {
          this.logs.set(item.date, item);
        }
      }
    }
  }

  private persist() {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(REVIEW_TRACKER_KEY, JSON.stringify(Array.from(this.logs.values())));
    }
  }

  async logReview(dateStr: string, xp: number): Promise<void> {
    const d = new Date(dateStr);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

    const existing = this.logs.get(dateKey) || { date: dateKey, count: 0, xpEarned: 0 };
    existing.count += 1;
    existing.xpEarned += xp;

    this.logs.set(dateKey, existing);
    this.persist();
  }

  async getRecentLogs(days = 7): Promise<DailyReviewLog[]> {
    const result: DailyReviewLog[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;

      const log = this.logs.get(dateKey) || { date: dateKey, count: 0, xpEarned: 0 };
      result.push(log);
    }

    return result;
  }
}

export const reviewTrackerRepo = new ReviewTrackerRepository();
