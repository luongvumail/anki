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
}
