import { Rating } from "../fsrs/fsrsTypes";

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null; // ISO YYYY-MM-DD
}

export class StreakCalculator {
  /**
   * Calculates earned XP based on user rating.
   */
  public calculateXP(rating: Rating): number {
    switch (rating) {
      case Rating.Again:
        return 2;
      case Rating.Hard:
        return 5;
      case Rating.Good:
        return 10;
      case Rating.Easy:
        return 15;
      default:
        return 5;
    }
  }

  /**
   * Updates streak state given a review date.
   */
  public updateStreak(currentStreakState: StreakState, reviewDate: Date = new Date()): StreakState {
    const reviewDateStr = this.toDateString(reviewDate);
    const lastDateStr = currentStreakState.lastStudyDate;

    if (lastDateStr === reviewDateStr) {
      // Already studied today, maintain streak
      return currentStreakState;
    }

    if (!lastDateStr) {
      // First time studying
      return {
        currentStreak: 1,
        longestStreak: Math.max(1, currentStreakState.longestStreak),
        lastStudyDate: reviewDateStr,
      };
    }

    const yesterdayStr = this.toDateString(new Date(reviewDate.getTime() - 24 * 3600 * 1000));

    if (lastDateStr === yesterdayStr) {
      // Consecutive day! Increment streak
      const newStreak = currentStreakState.currentStreak + 1;
      return {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, currentStreakState.longestStreak),
        lastStudyDate: reviewDateStr,
      };
    }

    // Streak broken, reset to 1 day
    return {
      currentStreak: 1,
      longestStreak: Math.max(1, currentStreakState.longestStreak),
      lastStudyDate: reviewDateStr,
    };
  }

  private toDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}
