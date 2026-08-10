import { ICardRepository } from "../../domain/card/cardRepository.i.js";
import { logger } from "../../ui/utils/logger.js";

export class SyncOfflineQueueUseCase {
  constructor(
    private readonly localRepo: ICardRepository,
    private readonly cloudRepo: ICardRepository,
  ) {}

  async execute(): Promise<{ syncedCount: number }> {
    const localCards = await this.localRepo.getAll();
    let syncedCount = 0;

    for (const card of localCards) {
      try {
        await this.cloudRepo.save(card);
        syncedCount += 1;
      } catch (e) {
        logger.error("Failed to sync card to cloud", { cardId: card.id, cause: e });
      }
    }

    logger.info(`Offline sync completed: ${syncedCount} cards synced`);
    return { syncedCount };
  }
}
