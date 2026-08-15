import { Card } from "../../store/slices/types";
import { createDefaultSRSState } from "../srs";

function assertStrictEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: expected ${expected}, got ${actual}. ${message || ""}`);
  }
}

function findExistingCard(cardsState: Record<string, Card[]>, character: string, deckId?: string): Card | undefined {
  const q = character.trim().toLowerCase();
  if (!q) return undefined;
  if (deckId && cardsState[deckId]) {
    return cardsState[deckId].find(
      (c) => c.character.trim().toLowerCase() === q || c.pinyin.trim().toLowerCase() === q,
    );
  }
  for (const dId of Object.keys(cardsState)) {
    const match = cardsState[dId].find(
      (c) => c.character.trim().toLowerCase() === q || c.pinyin.trim().toLowerCase() === q,
    );
    if (match) return match;
  }
  return undefined;
}

const mockCardsState: Record<string, Card[]> = {
  deck_1: [
    {
      id: "card_1",
      deckId: "deck_1",
      character: "苹果",
      pinyin: "píng guǒ",
      translation: "Quả táo",
      examples: [],
      srs: createDefaultSRSState(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  deck_2: [
    {
      id: "card_2",
      deckId: "deck_2",
      character: "香蕉",
      pinyin: "xiāng jiāo",
      translation: "Quả chuối",
      examples: [],
      srs: createDefaultSRSState(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};

export function runCardSliceLogicTests() {
  // Test 1: Find by character in specific deck
  const found1 = findExistingCard(mockCardsState, "苹果", "deck_1");
  assertStrictEqual(found1?.id, "card_1", "Should find card_1 by exact character");

  // Test 2: Find with leading/trailing whitespace
  const found2 = findExistingCard(mockCardsState, "  苹果  ", "deck_1");
  assertStrictEqual(found2?.id, "card_1", "Should trim whitespace when searching");

  // Test 3: Find by pinyin across all decks
  const found3 = findExistingCard(mockCardsState, "xiāng jiāo");
  assertStrictEqual(found3?.id, "card_2", "Should search across all decks if deckId is omitted");

  // Test 4: Not found for non-existent word
  const notFound = findExistingCard(mockCardsState, "西瓜");
  assertStrictEqual(notFound, undefined, "Non-existent character must return undefined");

  // Test 5: Empty query returns undefined
  assertStrictEqual(findExistingCard(mockCardsState, "   "), undefined, "Empty query must return undefined");

  // Test 6: Simulating optimistic update for unloaded deck (does not pollute cache with partial array)
  const initialDecks = [
    { id: "deck_unloaded", name: "HSK 1", cardCount: 10, dueCount: 4, newCount: 4 },
    { id: "deck_1", name: "HSK 2", cardCount: 1, dueCount: 1, newCount: 1 },
  ];
  const insertedBatchCount = 3;
  const targetDeckId = "deck_unloaded";

  const updatedDecks = initialDecks.map((d) =>
    d.id === targetDeckId
      ? {
          ...d,
          cardCount: (d.cardCount || 0) + insertedBatchCount,
          dueCount: (d.dueCount || 0) + insertedBatchCount,
          newCount: (d.newCount || 0) + insertedBatchCount,
        }
      : d,
  );

  const updatedUnloadedDeck = updatedDecks.find((d) => d.id === "deck_unloaded");
  assertStrictEqual(updatedUnloadedDeck?.cardCount, 13, "Total card count should increment by inserted count (10 + 3 = 13)");
  assertStrictEqual(updatedUnloadedDeck?.dueCount, 7, "Due count should increment by inserted count (4 + 3 = 7)");
  assertStrictEqual(updatedUnloadedDeck?.newCount, 7, "New count should increment by inserted count (4 + 3 = 7)");

  // Test 7: Total card count aggregation across loaded and unloaded decks
  const cardsCache: Record<string, Card[]> = {
    deck_1: mockCardsState.deck_1,
  };
  const aggregatedTotal = updatedDecks.reduce((sum, d) => {
    const deckCards = cardsCache[d.id];
    return sum + (deckCards ? deckCards.length : d.cardCount || 0);
  }, 0);
  assertStrictEqual(aggregatedTotal, 14, "Aggregated total should be 1 (deck_1 loaded) + 13 (deck_unloaded) = 14");
}
