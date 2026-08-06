import { StateCreator } from "zustand";
import { StreakState } from "../../../domain/streak/streakCalculator";
import { ReviewTrackerRepository } from "../../../infrastructure/persistence/reviewTrackerRepo";

const reviewTrackerRepo = new ReviewTrackerRepository();

export interface ProgressSlice {
  streakState: StreakState;
  xp: number;
  unlockedBadgeIds: string[];
  reviewHistory: Record<string, number>;
  streakCount: number;

  loadReviewHistory: () => Promise<void>;
  checkAndUnlockBadges: (streak?: number, learnedCards?: number) => Promise<void>;
}

export const createProgressSlice: StateCreator<ProgressSlice, [], [], ProgressSlice> = (
  set,
  get,
) => ({
  streakState: { currentStreak: 0, longestStreak: 0, lastStudyDate: null },
  xp: 0,
  unlockedBadgeIds: [],
  reviewHistory: {},
  streakCount: 0,

  loadReviewHistory: async () => {
    const history = await reviewTrackerRepo.getReviewHistory();
    const streak = await reviewTrackerRepo.getStreakCount();
    set({ reviewHistory: history, streakCount: streak });
  },

  checkAndUnlockBadges: async (streak?: number, learnedCards?: number) => {
    const currentStreak = streak ?? get().streakCount;
    const unlocked = new Set(get().unlockedBadgeIds);

    if (currentStreak >= 3) unlocked.add("streak_3");
    if (currentStreak >= 7) unlocked.add("streak_7");
    if (currentStreak >= 30) unlocked.add("streak_30");

    if (learnedCards !== undefined) {
      if (learnedCards >= 10) unlocked.add("vocab_10");
      if (learnedCards >= 50) unlocked.add("vocab_50");
      if (learnedCards >= 100) unlocked.add("vocab_100");
    }

    set({ unlockedBadgeIds: Array.from(unlocked) });
  },
});
