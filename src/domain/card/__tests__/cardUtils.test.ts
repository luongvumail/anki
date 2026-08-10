import { describe, expect, it } from "vitest";
import { State } from "../../fsrs/fsrsTypes.js";
import { CardEntity } from "../cardEntity.js";
import { getDueCards, isCardDue } from "../cardUtils.js";

describe("cardUtils", () => {
  it("should correctly identify due cards", () => {
    const pastDate = new Date(Date.now() - 3600000).toISOString();
    const futureDate = new Date(Date.now() + 3600000).toISOString();

    const dueCard: CardEntity = {
      id: "1",
      deckId: "d1",
      kanji: "日",
      pinyin: "rì",
      meaning: "Mặt trời",
      fsrsState: {
        stability: 1,
        difficulty: 5,
        reps: 1,
        lapses: 0,
        state: State.Review,
        last_review: null,
        due: pastDate,
      },
      createdAt: pastDate,
      updatedAt: pastDate,
    };

    const notDueCard: CardEntity = {
      ...dueCard,
      id: "2",
      fsrsState: { ...dueCard.fsrsState, due: futureDate },
    };

    expect(isCardDue(dueCard)).toBe(true);
    expect(isCardDue(notDueCard)).toBe(false);

    const dueCards = getDueCards([dueCard, notDueCard]);
    expect(dueCards.length).toBe(1);
    expect(dueCards[0].id).toBe("1");
  });
});
