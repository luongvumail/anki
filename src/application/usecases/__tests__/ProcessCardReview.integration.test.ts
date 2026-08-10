import { describe, expect, it } from "vitest";
import { DeckEntity } from "../../../domain/deck/deckEntity.js";
import { FSRSEngine } from "../../../domain/fsrs/fsrsEngine.js";
import { Rating, State } from "../../../domain/fsrs/fsrsTypes.js";
import {
  LocalStorageCardRepository,
  LocalStorageDeckRepository,
} from "../../../infrastructure/persistence/localStorageRepo.js";
import { AddCardUseCase } from "../AddCard.js";
import { ProcessCardReviewUseCase } from "../ProcessCardReview.js";

describe("ProcessCardReview Integration Test", () => {
  const fsrsEngine = new FSRSEngine();
  const cardRepo = new LocalStorageCardRepository();
  const deckRepo = new LocalStorageDeckRepository();

  const addCardUseCase = new AddCardUseCase(cardRepo, deckRepo, fsrsEngine);
  const processReviewUseCase = new ProcessCardReviewUseCase(cardRepo, deckRepo, fsrsEngine);

  it("should create card, review card, update FSRS state and return XP", async () => {
    // 1. Prepare Deck
    const mockDeck: DeckEntity = {
      id: "deck_hsk1",
      title: "HSK 1 Từ Vựng",
      description: "Bộ từ HSK 1 cơ bản",
      color: "#059669",
      cardCount: 0,
      newCardCount: 0,
      reviewCardCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await deckRepo.save(mockDeck);

    // 2. Add Card via UseCase
    const newCard = await addCardUseCase.execute({
      deckId: "deck_hsk1",
      kanji: "你好",
      pinyin: "nǐ hǎo",
      meaning: "Xin chào",
      hskLevel: 1,
    });

    expect(newCard.fsrsState.state).toBe(State.New);

    // 3. Process Card Review (Rating Good)
    const reviewResult = await processReviewUseCase.execute({
      cardId: newCard.id,
      rating: Rating.Good,
    });

    expect(reviewResult.xpEarned).toBe(15);
    expect(reviewResult.updatedCard.fsrsState.state).toBe(State.Review);
    expect(reviewResult.updatedCard.fsrsState.reps).toBe(1);

    // 4. Verify persisted state in Repository
    const persistedCard = await cardRepo.getById(newCard.id);
    expect(persistedCard).not.toBeNull();
    expect(persistedCard?.fsrsState.state).toBe(State.Review);
  });
});
