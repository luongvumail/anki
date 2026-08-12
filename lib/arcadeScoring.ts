import { useStore } from "../store/useStore";
import { recordReviewToday } from "./reviewTracker";

export const ARCADE_XP_REWARDS = {
  PERFECT_PRONUNCIATION: 20,
  GOOD_PRONUNCIATION: 10,
  SPEED_MATCH_BASE: 10,
  SENTENCE_BUILDER_BASE: 15,
} as const;

/**
 * Utility to record an arcade review session & reward XP
 */
export async function awardArcadeXP(amount: number): Promise<void> {
  try {
    useStore.getState().addXP(amount);
    await recordReviewToday();
  } catch (err) {
    console.warn("[arcadeScoring] Failed to award XP:", err);
  }
}
