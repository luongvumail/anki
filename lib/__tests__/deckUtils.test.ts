import {
  computeDueCount,
  computeNewCount,
  computeReviewDueCount,
  computeLearnedCount,
  getDeckMasteryPct,
} from "../deckUtils";
import { Card } from "../../store/slices/types";
import { FSRSState, createDefaultSRSState } from "../srs";

function assertStrictEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: expected ${expected}, got ${actual}. ${message || ""}`);
  }
}

const pastDate = new Date(Date.now() - 86400000).toISOString();
const futureDate = new Date(Date.now() + 86400000 * 5).toISOString();

const newCard: Card = {
  id: "1",
  deckId: "d1",
  character: "一",
  pinyin: "yī",
  translation: "Một",
  examples: [],
  srs: { ...createDefaultSRSState(), state: FSRSState.New, dueDate: pastDate },
  createdAt: pastDate,
  updatedAt: pastDate,
};

const dueReviewCard: Card = {
  id: "2",
  deckId: "d1",
  character: "二",
  pinyin: "èr",
  translation: "Hai",
  examples: [],
  srs: {
    ...createDefaultSRSState(),
    state: FSRSState.Review,
    repetitions: 3,
    dueDate: pastDate,
  },
  createdAt: pastDate,
  updatedAt: pastDate,
};

const learnedCardNotDue: Card = {
  id: "3",
  deckId: "d1",
  character: "三",
  pinyin: "sān",
  translation: "Ba",
  examples: [],
  srs: {
    ...createDefaultSRSState(),
    state: FSRSState.Review,
    repetitions: 5,
    dueDate: futureDate,
  },
  createdAt: pastDate,
  updatedAt: pastDate,
};

const testCards = [newCard, dueReviewCard, learnedCardNotDue];

export function runDeckUtilsTests() {
  // Test 1: computeDueCount
  assertStrictEqual(computeDueCount(testCards), 2, "2 cards are due (1 new + 1 review due)");
  assertStrictEqual(computeDueCount([]), 0, "Empty list should return 0 due");

  // Test 2: computeNewCount
  assertStrictEqual(computeNewCount(testCards), 1, "1 card is in FSRSState.New");

  // Test 3: computeReviewDueCount
  assertStrictEqual(computeReviewDueCount(testCards), 1, "1 review card is due");

  // Test 4: computeLearnedCount
  assertStrictEqual(computeLearnedCount(testCards), 1, "1 card is learned and not due today");

  // Test 5: getDeckMasteryPct
  const pct = getDeckMasteryPct(testCards.length, 0, testCards);
  assertStrictEqual(pct, 33, "1 out of 3 cards mastered = 33%");
  assertStrictEqual(getDeckMasteryPct(0, 0, []), 0, "Empty deck should return 0% mastery");
}
