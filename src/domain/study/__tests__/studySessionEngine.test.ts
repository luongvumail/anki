import { describe, expect, it } from "vitest";
import { StudySessionEngine } from "../studySessionEngine";
import { CardEntity } from "../../card/cardEntity";
import { Rating } from "../../fsrs/fsrsTypes";

describe("StudySessionEngine", () => {
  const engine = new StudySessionEngine(5);

  it("prepares study session pool and quiz questions correctly", () => {
    const deckCards: CardEntity[] = [
      {
        id: "card-1",
        deckId: "deck-1",
        character: "你好",
        pinyin: "nǐ hǎo",
        translation: "Hello",
        examples: [],
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
      {
        id: "card-2",
        deckId: "deck-1",
        character: "谢谢",
        pinyin: "xiè xie",
        translation: "Thank you",
        examples: [],
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ];

    const session = engine.prepareSession(deckCards);

    expect(session.targetCards).toHaveLength(2);
    expect(session.questions).toHaveLength(2);
    expect(session.isExtraPractice).toBe(false);
  });

  it("maps reaction times and correctness to FSRS Rating correctly", () => {
    // Incorrect answer -> Again
    expect(engine.determineFSRSRating(false, 1000, false)).toBe(Rating.Again);

    // Retry answer -> Hard
    expect(engine.determineFSRSRating(true, 1000, true)).toBe(Rating.Hard);

    // Quick answer (<= 3.5s) -> Easy
    expect(engine.determineFSRSRating(true, 2500, false)).toBe(Rating.Easy);

    // Normal answer (> 3.5s) -> Good
    expect(engine.determineFSRSRating(true, 4000, false)).toBe(Rating.Good);
  });
});
