import { CardEntity, ensureFSRSState } from './cardEntity';
import { State } from '../fsrs/fsrsTypes';

export function isDue(srs?: { due?: string; dueDate?: string }): boolean {
  if (!srs) return true;
  const dueStr = srs.due || srs.dueDate;
  if (!dueStr) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueStr);
  due.setHours(0, 0, 0, 0);
  return due <= today;
}

/**
 * Calculates total cards due for study today (both new cards + review due cards).
 */
export function computeDueCount(cards: CardEntity[]): number {
  if (!cards || cards.length === 0) return 0;
  return cards.filter((c) => {
    const fsrs = ensureFSRSState(c);
    return isDue({ due: fsrs.due });
  }).length;
}

/**
 * Calculates new card count (0 repetitions, never reviewed before).
 */
export function computeNewCount(cards: CardEntity[]): number {
  if (!cards || cards.length === 0) return 0;
  return cards.filter((c) => {
    const fsrs = ensureFSRSState(c);
    return fsrs.state === State.New || fsrs.reps === 0;
  }).length;
}

/**
 * Calculates review cards count (already learned at least once, due for review today).
 */
export function computeReviewDueCount(cards: CardEntity[]): number {
  if (!cards || cards.length === 0) return 0;
  return cards.filter((c) => {
    const fsrs = ensureFSRSState(c);
    return fsrs.reps > 0 && isDue({ due: fsrs.due });
  }).length;
}

/**
 * Calculates learned / mastered cards count (reviewed at least once and NOT due today).
 */
export function computeLearnedCount(cards: CardEntity[]): number {
  if (!cards || cards.length === 0) return 0;
  return cards.filter((c) => {
    const fsrs = ensureFSRSState(c);
    return fsrs.reps > 0 && !isDue({ due: fsrs.due });
  }).length;
}

/**
 * Returns user-facing mastery percentage (0-100) for a deck or card set.
 */
export function getDeckMasteryPct(cardCount: number, dueCount: number, cards?: CardEntity[]): number {
  if (cards && cards.length > 0) {
    const total = cards.length;
    if (total <= 0) return 0;
    const learned = computeLearnedCount(cards);
    return Math.round((learned / total) * 100);
  }
  if (cardCount <= 0) return 0;
  const learned = Math.max(0, cardCount - dueCount);
  return Math.round((learned / cardCount) * 100);
}
