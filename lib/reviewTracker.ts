import AsyncStorage from "@react-native-async-storage/async-storage";

const REVIEW_HISTORY_KEY = "@anki_review_history";

// In-memory cache to avoid redundant AsyncStorage reads
let _reviewHistoryCache: Record<string, number> | null = null;
let _writeDebounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Returns a map of YYYY-MM-DD -> count of reviews completed on that day.
 */
export async function getReviewHistory(): Promise<Record<string, number>> {
  if (_reviewHistoryCache !== null) return _reviewHistoryCache;
  try {
    const json = await AsyncStorage.getItem(REVIEW_HISTORY_KEY);
    _reviewHistoryCache = json ? JSON.parse(json) : {};
    return _reviewHistoryCache!;
  } catch (e) {
    console.warn("[reviewTracker] Error reading review history:", e);
    return {};
  }
}

/**
 * Records a card review for today (YYYY-MM-DD) in local persistent storage.
 * Uses in-memory cache + debounced write to minimize AsyncStorage I/O.
 */
export async function recordReviewToday(): Promise<void> {
  try {
    const history = await getReviewHistory();
    const todayStr = new Date().toISOString().split("T")[0];
    history[todayStr] = (history[todayStr] || 0) + 1;
    _reviewHistoryCache = history;

    // Debounce: write to AsyncStorage at most once every 2 seconds
    if (_writeDebounceTimer) clearTimeout(_writeDebounceTimer);
    _writeDebounceTimer = setTimeout(async () => {
      try {
        await AsyncStorage.setItem(REVIEW_HISTORY_KEY, JSON.stringify(_reviewHistoryCache));
      } catch (e) {
        console.warn("[reviewTracker] Error saving review history:", e);
      }
    }, 2000);
  } catch (e) {
    console.warn("[reviewTracker] Error recording review:", e);
  }
}

/**
 * Calculates the current daily study streak.
 * A streak is the number of consecutive days (ending today or yesterday) with at least 1 review.
 */
export async function getStreakCount(): Promise<number> {
  try {
    const history = await getReviewHistory();
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      if (history[dateStr] && history[dateStr] > 0) {
        streak++;
      } else {
        // Allow 1-day grace: if today has no reviews yet but yesterday did, streak still counts
        if (i === 0) continue;
        break;
      }
    }
    return streak;
  } catch {
    return 0;
  }
}
