import { describe, expect, it } from "vitest";
import { Rating } from "../../fsrs/fsrsTypes";
import { StreakCalculator, StreakState } from "../streakCalculator";

describe("StreakCalculator", () => {
  const calculator = new StreakCalculator();

  it("calculates XP based on ratings", () => {
    expect(calculator.calculateXP(Rating.Again)).toBe(2);
    expect(calculator.calculateXP(Rating.Hard)).toBe(5);
    expect(calculator.calculateXP(Rating.Good)).toBe(10);
    expect(calculator.calculateXP(Rating.Easy)).toBe(15);
  });

  it("starts streak at 1 on first study", () => {
    const initial: StreakState = { currentStreak: 0, longestStreak: 0, lastStudyDate: null };
    const today = new Date("2026-08-06T10:00:00Z");
    const updated = calculator.updateStreak(initial, today);

    expect(updated.currentStreak).toBe(1);
    expect(updated.longestStreak).toBe(1);
    expect(updated.lastStudyDate).toBe("2026-08-06");
  });

  it("increments streak when studying on consecutive days", () => {
    const day1State: StreakState = {
      currentStreak: 1,
      longestStreak: 1,
      lastStudyDate: "2026-08-05",
    };
    const day2 = new Date("2026-08-06T10:00:00Z");
    const updated = calculator.updateStreak(day1State, day2);

    expect(updated.currentStreak).toBe(2);
    expect(updated.longestStreak).toBe(2);
    expect(updated.lastStudyDate).toBe("2026-08-06");
  });

  it("resets streak to 1 if day missed", () => {
    const day1State: StreakState = {
      currentStreak: 5,
      longestStreak: 5,
      lastStudyDate: "2026-08-03",
    };
    const today = new Date("2026-08-06T10:00:00Z");
    const updated = calculator.updateStreak(day1State, today);

    expect(updated.currentStreak).toBe(1);
    expect(updated.longestStreak).toBe(5);
    expect(updated.lastStudyDate).toBe("2026-08-06");
  });
});
