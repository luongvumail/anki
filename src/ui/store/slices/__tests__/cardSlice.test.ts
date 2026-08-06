import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCardSlice } from "../cardSlice";
import { CardEntity } from "../../../../domain/card/cardEntity";
import { Rating } from "../../../../domain/fsrs/fsrsTypes";

vi.mock("../../../../infrastructure/persistence/firestoreRepo", () => {
  return {
    FirestoreCardRepository: class {
      getCards = vi.fn().mockResolvedValue([
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
      ]);
      saveCard = vi.fn().mockResolvedValue(undefined);
      saveCards = vi.fn().mockResolvedValue(undefined);
      deleteCard = vi.fn().mockResolvedValue(undefined);
    },
  };
});

vi.mock("../../../../infrastructure/persistence/reviewTrackerRepo", () => {
  return {
    ReviewTrackerRepository: class {
      recordReviewToday = vi.fn().mockResolvedValue(undefined);
    },
  };
});

describe("cardSlice", () => {
  let storeState: any;
  let set: any;
  let get: any;

  beforeEach(() => {
    storeState = {
      cards: {},
      isCardLoading: false,
      cardError: null,
      xp: 0,
      streakState: { currentStreak: 0, longestStreak: 0, lastStudyDate: null },
    };
    set = (fn: any) => {
      const next = typeof fn === "function" ? fn(storeState) : fn;
      Object.assign(storeState, next);
    };
    get = () => storeState;
  });

  it("fetches cards for a deck successfully", async () => {
    const slice = createCardSlice(set, get, {} as any);
    const result = await slice.fetchCards("deck-1");

    expect(storeState.isCardLoading).toBe(false);
    expect(result).toHaveLength(1);
    expect(storeState.cards["deck-1"]).toHaveLength(1);
  });

  it("adds a card to store and triggers repository save", async () => {
    const slice = createCardSlice(set, get, {} as any);
    const addedCard = await slice.addCard({
      deckId: "deck-1",
      character: "谢谢",
      pinyin: "xiè xie",
      translation: "Thank you",
      examples: [],
    });

    expect(addedCard.id).toBeDefined();
    expect(storeState.cards["deck-1"]).toHaveLength(1);
    expect(storeState.cards["deck-1"][0].character).toBe("谢谢");
  });

  it("processes review rating and updates XP", async () => {
    const slice = createCardSlice(set, get, {} as any);
    const initialCard: CardEntity = {
      id: "card-1",
      deckId: "deck-1",
      character: "你好",
      pinyin: "nǐ hǎo",
      translation: "Hello",
      examples: [],
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    storeState.cards["deck-1"] = [initialCard];

    const { updatedCard } = await slice.processReview(initialCard, Rating.Good);

    expect(updatedCard.fsrs).toBeDefined();
    expect(storeState.xp).toBe(10); // Good = 10 XP
  });

  it("resets deck progress for all cards in a deck", async () => {
    const slice = createCardSlice(set, get, {} as any);
    const initialCard: CardEntity = {
      id: "card-1",
      deckId: "deck-1",
      character: "你好",
      pinyin: "nǐ hǎo",
      translation: "Hello",
      examples: [],
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    storeState.cards["deck-1"] = [initialCard];

    await slice.resetDeckProgress("deck-1");

    expect(storeState.cards["deck-1"][0].fsrs?.reps).toBe(0);
    expect(storeState.cards["deck-1"][0].fsrs?.stability).toBe(0);
  });
});
