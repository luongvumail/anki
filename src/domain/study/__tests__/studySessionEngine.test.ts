import { describe, expect, it } from "vitest";
import { CardEntity } from "../../card/cardEntity.js";
import { State } from "../../fsrs/fsrsTypes.js";
import { StudySessionEngine } from "../studySessionEngine.js";

describe("StudySessionEngine", () => {
  const engine = new StudySessionEngine();

  it("should divide due cards into New, Learning, and Review queues", () => {
    const pastDate = new Date(Date.now() - 3600000).toISOString();

    const newCard: CardEntity = {
      id: "1",
      deckId: "d1",
      kanji: "一",
      pinyin: "yī",
      meaning: "Một",
      fsrsState: {
        stability: 0,
        difficulty: 0,
        reps: 0,
        lapses: 0,
        state: State.New,
        last_review: null,
        due: pastDate,
      },
      createdAt: pastDate,
      updatedAt: pastDate,
    };

    const reviewCard: CardEntity = {
      ...newCard,
      id: "2",
      fsrsState: { ...newCard.fsrsState, state: State.Review, stability: 5 },
    };

    const queue = engine.prepareSessionQueue([newCard, reviewCard]);
    expect(queue.newCards.length).toBe(1);
    expect(queue.reviewCards.length).toBe(1);
  });
});
