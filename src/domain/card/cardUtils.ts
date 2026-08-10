import { CardEntity } from "./cardEntity.js";
import { State } from "../fsrs/fsrsTypes.js";

/**
 * Checks if a card is due for FSRS review at specified timestamp.
 */
export function isCardDue(card: CardEntity, now: Date = new Date()): boolean {
  if (!card.fsrsState.due) return true;
  return new Date(card.fsrsState.due).getTime() <= now.getTime();
}

/**
 * Filters array of cards returning only those due for review.
 */
export function getDueCards(cards: CardEntity[], now: Date = new Date()): CardEntity[] {
  return cards.filter((card) => isCardDue(card, now));
}

/**
 * Sorts cards by FSRS due date (earliest due first).
 */
export function sortByDue(cards: CardEntity[]): CardEntity[] {
  return [...cards].sort(
    (a, b) => new Date(a.fsrsState.due).getTime() - new Date(b.fsrsState.due).getTime(),
  );
}

/**
 * Calculates total cards due for study today (both new cards + review due cards).
 */
export function computeDueCount(cards: CardEntity[]): number {
  if (!cards || cards.length === 0) return 0;
  return cards.filter((c) => isCardDue(c)).length;
}

/**
 * Calculates new card count (0 repetitions, never reviewed before).
 */
export function computeNewCount(cards: CardEntity[]): number {
  if (!cards || cards.length === 0) return 0;
  return cards.filter((c) => c.fsrsState.state === State.New || c.fsrsState.reps === 0).length;
}

/**
 * Calculates review cards count (already learned at least once, due for review today).
 */
export function computeReviewDueCount(cards: CardEntity[]): number {
  if (!cards || cards.length === 0) return 0;
  return cards.filter((c) => c.fsrsState.reps > 0 && isCardDue(c)).length;
}

/**
 * Calculates learned / mastered cards count (reviewed at least once and NOT due today).
 */
export function computeLearnedCount(cards: CardEntity[]): number {
  if (!cards || cards.length === 0) return 0;
  return cards.filter((c) => c.fsrsState.reps > 0 && !isCardDue(c)).length;
}

/**
 * Returns user-facing mastery percentage (0-100) for a deck or card set.
 */
export function getDeckMasteryPct(
  cardCount: number,
  dueCount: number,
  cards?: CardEntity[],
): number {
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

/**
 * Calculates total due queue summary across ALL decks for the Smart Daily Queue on HomeScreen.
 */
export function getDailyDueSummary(cardsRecord: Record<string, CardEntity[]>): {
  totalDue: number;
  urgentDeckId: string | null;
  urgentDeckDueCount: number;
} {
  let totalDue = 0;
  let urgentDeckId: string | null = null;
  let maxDue = 0;

  Object.entries(cardsRecord).forEach(([deckId, deckCards]) => {
    const due = computeDueCount(deckCards);
    totalDue += due;
    if (due > maxDue) {
      maxDue = due;
      urgentDeckId = deckId;
    }
  });

  return {
    totalDue,
    urgentDeckId,
    urgentDeckDueCount: maxDue,
  };
}

/**
 * Uses FSRS retrievability decay formula R(t) = e^(-t/S) to forecast how many learned cards
 * will drop below 70% retention after specified days (default: 1 day ahead).
 */
export function computeForecastForgotten(
  cardsRecord: Record<string, CardEntity[]>,
  daysAhead = 1,
): number {
  let countAtRisk = 0;

  Object.values(cardsRecord).forEach((deckCards) => {
    deckCards.forEach((c) => {
      if (c.fsrsState.reps > 0 && c.fsrsState.stability > 0) {
        const S = c.fsrsState.stability;
        const R = Math.exp(-daysAhead / S);
        if (R < 0.7) {
          countAtRisk++;
        }
      }
    });
  });

  return countAtRisk;
}
