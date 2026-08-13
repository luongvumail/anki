import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

const BASE_REVIEW_HISTORY_KEY = "@anki_review_history";

// In-memory cache to avoid redundant AsyncStorage reads
let _reviewHistoryCache: Record<string, number> | null = null;
let _currentCachedUserId: string | null = null;
let _writeDebounceTimer: ReturnType<typeof setTimeout> | null = null;

async function getStorageKey(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const uid = data?.user?.id;
  return uid ? `${BASE_REVIEW_HISTORY_KEY}_${uid}` : BASE_REVIEW_HISTORY_KEY;
}

export function clearReviewTrackerCache(): void {
  _reviewHistoryCache = null;
  _currentCachedUserId = null;
  if (_writeDebounceTimer) clearTimeout(_writeDebounceTimer);
}

/**
 * Returns YYYY-MM-DD string formatted in local system time.
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns a map of YYYY-MM-DD -> count of reviews completed on that day for the current user.
 */
export async function getReviewHistory(): Promise<Record<string, number>> {
  const { data } = await supabase.auth.getUser();
  const uid = data?.user?.id || null;

  if (_reviewHistoryCache !== null && _currentCachedUserId === uid) {
    return _reviewHistoryCache;
  }

  try {
    const key = await getStorageKey();
    const json = await AsyncStorage.getItem(key);
    _reviewHistoryCache = json ? JSON.parse(json) : {};
    _currentCachedUserId = uid;
    return _reviewHistoryCache!;
  } catch (e) {
    console.warn("[reviewTracker] Error reading review history:", e);
    return {};
  }
}

/**
 * Records a card review for today (YYYY-MM-DD) in local persistent storage.
 */
export async function recordReviewToday(): Promise<void> {
  try {
    const history = await getReviewHistory();
    const todayStr = getLocalDateString();
    history[todayStr] = (history[todayStr] || 0) + 1;
    _reviewHistoryCache = history;

    const key = await getStorageKey();

    // Debounce: write to AsyncStorage at most once every 2 seconds
    if (_writeDebounceTimer) clearTimeout(_writeDebounceTimer);
    _writeDebounceTimer = setTimeout(async () => {
      try {
        await AsyncStorage.setItem(key, JSON.stringify(_reviewHistoryCache));
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

    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = getLocalDateString(d);
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
