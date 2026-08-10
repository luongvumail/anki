import { describe, expect, it } from "vitest";
import { DeckEntity } from "../../../domain/deck/deckEntity.js";
import { Rating } from "../../../domain/fsrs/fsrsTypes.js";
import { container } from "../../../infrastructure/container.js";
import { appStore } from "../useAppStore.js";

describe("AppStore UI Store", () => {
  it("should load decks, add cards and update user progress XP on review", async () => {
    const mockDeck: DeckEntity = {
      id: "deck_store_test",
      title: "Store Test Deck",
      description: "Test",
      color: "#059669",
      cardCount: 0,
      newCardCount: 0,
      reviewCardCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await container.deckRepo.save(mockDeck);

    await appStore.loadDecks();
    expect(appStore.getState().decks.length).toBeGreaterThan(0);

    await appStore.addCard({
      deckId: "deck_store_test",
      kanji: "日",
      pinyin: "rì",
      meaning: "Mặt trời",
    });
    const cards = await container.cardRepo.getByDeckId("deck_store_test");
    expect(cards.length).toBe(1);

    const initialXp = appStore.getState().userProgress.totalXp;
    await appStore.processReview(cards[0], Rating.Good);
    expect(appStore.getState().userProgress.totalXp).toBeGreaterThanOrEqual(initialXp);

    // Verify card review processing
    const updatedCards = await container.cardRepo.getByDeckId("deck_store_test");
    expect(updatedCards[0].fsrsState.reps).toBe(1);
  });
});
