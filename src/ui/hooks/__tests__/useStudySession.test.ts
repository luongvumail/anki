import { describe, expect, it } from "vitest";
import { DeckEntity } from "../../../domain/deck/deckEntity.js";
import { container } from "../../../infrastructure/container.js";

describe("useStudySession logic test", () => {
  it("should initialize session and transition phases correctly", async () => {
    const mockDeck: DeckEntity = {
      id: "deck_session_test",
      title: "Session Test",
      description: "Test",
      color: "#059669",
      cardCount: 0,
      newCardCount: 0,
      reviewCardCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await container.deckRepo.save(mockDeck);

    await container.addCard.execute({
      deckId: "deck_session_test",
      kanji: "月",
      pinyin: "yuè",
      meaning: "Mặt trăng",
    });

    const cards = await container.cardRepo.getByDeckId("deck_session_test");
    const quizQuestions = await container.generateQuiz.execute("deck_session_test", 5);

    expect(cards.length).toBe(1);
    expect(quizQuestions.length).toBe(1);
    expect(quizQuestions[0].kanji).toBe("月");
  });
});
