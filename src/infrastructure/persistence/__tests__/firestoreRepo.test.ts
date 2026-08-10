import { describe, expect, it } from "vitest";
import { CardEntity } from "../../../domain/card/cardEntity.js";
import { State } from "../../../domain/fsrs/fsrsTypes.js";
import { FirestoreCardRepository } from "../firestoreRepo.js";

describe("FirestoreCardRepository (Last-Write-Wins Conflict Resolution)", () => {
  it("should overwrite remote card if local card updatedAt is newer", async () => {
    const firestoreRepo = new FirestoreCardRepository();

    const olderCard: CardEntity = {
      id: "card_1",
      deckId: "deck_1",
      kanji: "水",
      pinyin: "shuǐ",
      meaning: "Nước cũ",
      fsrsState: {
        stability: 1,
        difficulty: 5,
        reps: 1,
        lapses: 0,
        state: State.Learning,
        last_review: "2026-08-01T10:00:00Z",
        due: "2026-08-02T10:00:00Z",
      },
      createdAt: "2026-08-01T10:00:00Z",
      updatedAt: "2026-08-01T10:00:00Z",
    };
    await firestoreRepo.save(olderCard);

    const newerCard: CardEntity = {
      ...olderCard,
      meaning: "Nước mới cập nhật",
      updatedAt: "2026-08-10T10:00:00Z",
    };
    await firestoreRepo.save(newerCard);

    const saved = await firestoreRepo.getById("card_1");
    expect(saved?.meaning).toBe("Nước mới cập nhật");
  });

  it("should NOT overwrite remote card if local card updatedAt is older", async () => {
    const firestoreRepo = new FirestoreCardRepository();

    const newerCard: CardEntity = {
      id: "card_1",
      deckId: "deck_1",
      kanji: "火",
      pinyin: "huǒ",
      meaning: "Lửa từ Cloud",
      fsrsState: {
        stability: 2,
        difficulty: 4,
        reps: 2,
        lapses: 0,
        state: State.Review,
        last_review: "2026-08-10T10:00:00Z",
        due: "2026-08-15T10:00:00Z",
      },
      createdAt: "2026-08-01T10:00:00Z",
      updatedAt: "2026-08-10T10:00:00Z",
    };
    await firestoreRepo.save(newerCard);

    const olderLocalCard: CardEntity = {
      ...newerCard,
      meaning: "Lửa cũ từ máy",
      updatedAt: "2026-08-05T10:00:00Z", // Older timestamp
    };
    await firestoreRepo.save(olderLocalCard);

    const saved = await firestoreRepo.getById("card_1");
    expect(saved?.meaning).toBe("Lửa từ Cloud"); // Remote won
  });
});
