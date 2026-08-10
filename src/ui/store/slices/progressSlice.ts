import {
  calculateLevel,
  initialUserProgress,
  UserProgress,
} from "../../../domain/user/userProgress.js";
import { ProgressSliceState } from "../types.js";

export const createProgressSlice = (
  set: (fn: (state: ProgressSliceState) => Partial<ProgressSliceState>) => void,
  get: () => ProgressSliceState,
): ProgressSliceState => ({
  userProgress: initialUserProgress,
  streakState: {
    currentStreak: 1,
    lastActiveDate: new Date().toISOString(),
    isActiveToday: true,
  },

  addXp: (amount: number) => {
    const current = get().userProgress;
    const newTotalXp = current.totalXp + amount;
    const newLevel = calculateLevel(newTotalXp);

    const updated: UserProgress = {
      ...current,
      totalXp: newTotalXp,
      level: newLevel,
      lastStudyDate: new Date().toISOString(),
    };

    set(() => ({ userProgress: updated }));
  },

  updateStreak: (date: Date = new Date()) => {
    const current = get().streakState;
    set(() => ({
      streakState: {
        currentStreak: current.currentStreak + 1,
        lastActiveDate: date.toISOString(),
        isActiveToday: true,
      },
    }));
  },
});
