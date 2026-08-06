import { ICardRepository } from "../../domain/card/cardRepository.i";
import {
  LocalStorageRepo,
  SyncOfflinePayload,
} from "../../infrastructure/persistence/localStorageRepo";

export interface SyncResult {
  syncedCount: number;
  failedCount: number;
  errors: string[];
}

export class SyncOfflineQueueUseCase {
  private localRepo: LocalStorageRepo;
  private remoteRepo: ICardRepository;

  constructor(localRepo: LocalStorageRepo, remoteRepo: ICardRepository) {
    this.localRepo = localRepo;
    this.remoteRepo = remoteRepo;
  }

  public async execute(): Promise<SyncResult> {
    const queue: SyncOfflinePayload[] = await this.localRepo.getOfflineQueue();
    if (queue.length === 0) {
      return { syncedCount: 0, failedCount: 0, errors: [] };
    }

    const syncedIds: string[] = [];
    const errors: string[] = [];
    let syncedCount = 0;
    let failedCount = 0;

    for (const item of queue) {
      try {
        await this.remoteRepo.saveCard(item.card);
        syncedIds.push(item.id);
        syncedCount += 1;
      } catch (err: any) {
        failedCount += 1;
        errors.push(`Card ${item.cardId} sync failed: ${err?.message || "Unknown error"}`);
      }
    }

    if (syncedIds.length > 0) {
      await this.localRepo.removeOfflineReviews(syncedIds);
    }

    return {
      syncedCount,
      failedCount,
      errors,
    };
  }
}
