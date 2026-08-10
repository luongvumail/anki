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
    currentStreak: 0,
    lastActiveDate: null,
    isActiveToday: false,
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
    const state = get();
    const current = state.streakState;
    const todayStr = date.toISOString().split("T")[0];

    if (current.lastActiveDate) {
      const lastDateStr = current.lastActiveDate.split("T")[0];
      if (lastDateStr === todayStr) {
        set(() => ({
          streakState: { ...current, isActiveToday: true },
        }));
        return;
      }

      const lastD = new Date(lastDateStr);
      const todayD = new Date(todayStr);
      const diffTime = Math.abs(todayD.getTime() - lastD.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      let newStreak = 1;
      if (diffDays === 1) {
        newStreak = current.currentStreak + 1;
      }

      const newProgress: UserProgress = {
        ...state.userProgress,
        streakDays: newStreak,
        lastStudyDate: date.toISOString(),
      };

      set(() => ({
        userProgress: newProgress,
        streakState: {
          currentStreak: newStreak,
          lastActiveDate: date.toISOString(),
          isActiveToday: true,
        },
      }));
    } else {
      const newProgress: UserProgress = {
        ...state.userProgress,
        streakDays: 1,
        lastStudyDate: date.toISOString(),
      };
      set(() => ({
        userProgress: newProgress,
        streakState: {
          currentStreak: 1,
          lastActiveDate: date.toISOString(),
          isActiveToday: true,
        },
      }));
    }
  },
});
