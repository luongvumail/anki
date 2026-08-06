import { describe, expect, it, vi } from "vitest";
import { ICardRepository } from "../../../domain/card/cardRepository.i";
import {
  LocalStorageRepo,
  SyncOfflinePayload,
} from "../../../infrastructure/persistence/localStorageRepo";
import { SyncOfflineQueueUseCase } from "../SyncOfflineQueue";

describe("SyncOfflineQueueUseCase", () => {
  it("syncs offline queued reviews to remote repository and removes them from local queue", async () => {
    const mockQueueItem: SyncOfflinePayload = {
      id: "sync-1",
      cardId: "card-123",
      deckId: "deck-456",
      card: {
        id: "card-123",
        deckId: "deck-456",
        character: "学习",
        pinyin: "xué xí",
        translation: "to study",
        examples: [],
        createdAt: "2026-08-06T00:00:00Z",
        updatedAt: "2026-08-06T00:00:00Z",
      },
      reviewLog: {
        rating: 3,
        state: 1,
        due: "2026-08-07T00:00:00Z",
        stability: 1.5,
        difficulty: 5.0,
        elapsed_days: 0,
        scheduled_days: 1,
        review: "2026-08-06T00:00:00Z",
      },
      timestamp: "2026-08-06T00:00:00Z",
    };

    const mockLocalRepo = {
      getOfflineQueue: vi.fn().mockResolvedValue([mockQueueItem]),
      removeOfflineReviews: vi.fn().mockResolvedValue(undefined),
    } as unknown as LocalStorageRepo;

    const mockRemoteRepo = {
      saveCard: vi.fn().mockResolvedValue(undefined),
    } as unknown as ICardRepository;

    const useCase = new SyncOfflineQueueUseCase(mockLocalRepo, mockRemoteRepo);
    const result = await useCase.execute();

    expect(result.syncedCount).toBe(1);
    expect(result.failedCount).toBe(0);
    expect(mockRemoteRepo.saveCard).toHaveBeenCalledWith(mockQueueItem.card);
    expect(mockLocalRepo.removeOfflineReviews).toHaveBeenCalledWith(["sync-1"]);
  });
});
