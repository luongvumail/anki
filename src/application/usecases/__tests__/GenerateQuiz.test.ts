import { describe, expect, it } from "vitest";
import { DeckEntity } from "../../../domain/deck/deckEntity.js";
import { FSRSEngine } from "../../../domain/fsrs/fsrsEngine.js";
import {
  LocalStorageCardRepository,
  LocalStorageDeckRepository,
} from "../../../infrastructure/persistence/localStorageRepo.js";
import { AddCardUseCase } from "../AddCard.js";
import { GenerateQuizUseCase } from "../GenerateQuiz.js";

describe("GenerateQuizUseCase", () => {
  const cardRepo = new LocalStorageCardRepository();
  const deckRepo = new LocalStorageDeckRepository();
  const fsrsEngine = new FSRSEngine();

  const addCardUseCase = new AddCardUseCase(cardRepo, deckRepo, fsrsEngine);
  const generateQuizUseCase = new GenerateQuizUseCase(cardRepo);

  it("should generate multiple choice quiz questions with correct answers", async () => {
    const mockDeck: DeckEntity = {
      id: "deck_test",
      title: "Test Deck",
      description: "Test",
      color: "#059669",
      cardCount: 0,
      newCardCount: 0,
      reviewCardCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await deckRepo.save(mockDeck);

    await addCardUseCase.execute({
      deckId: "deck_test",
      kanji: "水",
      pinyin: "shuǐ",
      meaning: "Nước",
    });
    await addCardUseCase.execute({
      deckId: "deck_test",
      kanji: "火",
      pinyin: "huǒ",
      meaning: "Lửa",
    });
    await addCardUseCase.execute({ deckId: "deck_test", kanji: "木", pinyin: "mù", meaning: "Gỗ" });
    await addCardUseCase.execute({
      deckId: "deck_test",
      kanji: "金",
      pinyin: "jīn",
      meaning: "Vàng",
    });

    const questions = await generateQuizUseCase.execute("deck_test", 4);

    expect(questions.length).toBe(4);
    for (const q of questions) {
      expect(q.options).toContain(q.correctAnswer);
      expect(q.options.length).toBe(4);
    }
  });
});
