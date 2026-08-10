import { describe, expect, it } from "vitest";
import { calculateStreak } from "../streakCalculator.js";

describe("streakCalculator", () => {
  it("should return 0 for empty activity dates", () => {
    expect(calculateStreak([])).toBe(0);
  });

  it("should calculate streak correctly when user studied today and yesterday", () => {
    const today = new Date().toISOString();
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();

    expect(calculateStreak([today, yesterday, twoDaysAgo])).toBe(3);
  });

  it("should maintain streak if studied yesterday but not today yet", () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    expect(calculateStreak([yesterday])).toBe(1);
  });

  it("should return 0 if missed yesterday and today", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
    expect(calculateStreak([threeDaysAgo])).toBe(0);
  });
});
