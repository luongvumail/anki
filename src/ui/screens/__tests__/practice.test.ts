import { describe, expect, it } from "vitest";
import { DeckEntity } from "../../../domain/deck/deckEntity.js";
import { container } from "../../../infrastructure/container.js";

describe("Practice Arcade Mini-games", () => {
  it("should initialize arcade cards for SpeedMatch game", async () => {
    const mockDeck: DeckEntity = {
      id: "deck_arcade_test",
      title: "Arcade Deck",
      description: "Testing arcade mini-game setup",
      color: "#059669",
      cardCount: 2,
      newCardCount: 2,
      reviewCardCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await container.deckRepo.save(mockDeck);

    await container.addCard.execute({
      deckId: "deck_arcade_test",
      kanji: "天",
      pinyin: "tiān",
      meaning: "Trời",
    });

    const cards = await container.cardRepo.getByDeckId("deck_arcade_test");
    expect(cards.length).toBe(1);
    expect(cards[0].kanji).toBe("天");
  });
});
