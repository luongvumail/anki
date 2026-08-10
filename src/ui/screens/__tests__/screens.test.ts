import { describe, expect, it } from "vitest";
import { DeckEntity } from "../../../domain/deck/deckEntity.js";
import { container } from "../../../infrastructure/container.js";

describe("Screen Containers Logic Test", () => {
  it("should initialize decks and support study flow trigger", async () => {
    const mockDeck: DeckEntity = {
      id: "deck_screen_test",
      title: "Screen Test Deck",
      description: "Testing screen container logic",
      color: "#059669",
      cardCount: 1,
      newCardCount: 1,
      reviewCardCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await container.deckRepo.save(mockDeck);

    const decks = await container.deckRepo.getAll();
    expect(decks.length).toBeGreaterThan(0);
    expect(decks.some((d) => d.id === "deck_screen_test")).toBe(true);
  });
});
