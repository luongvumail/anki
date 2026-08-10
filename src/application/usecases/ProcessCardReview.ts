import { CardEntity } from "../../domain/card/cardEntity.js";
import { ICardRepository } from "../../domain/card/cardRepository.i.js";
import { IDeckRepository } from "../../domain/deck/deckRepository.i.js";
import { FSRSEngine } from "../../domain/fsrs/fsrsEngine.js";
import { Rating, State } from "../../domain/fsrs/fsrsTypes.js";
import { XP_PER_RATING } from "../../domain/user/userProgress.js";

export interface ProcessCardReviewInput {
  cardId: string;
  rating: Rating;
  reviewDate?: Date;
}

export interface ProcessCardReviewResult {
  updatedCard: CardEntity;
  xpEarned: number;
  isDueForReview: boolean;
}

export class ProcessCardReviewUseCase {
  constructor(
    private readonly cardRepo: ICardRepository,
    private readonly deckRepo: IDeckRepository,
    private readonly fsrsEngine: FSRSEngine
  ) {}

  async execute(input: ProcessCardReviewInput): Promise<ProcessCardReviewResult> {
    const card = await this.cardRepo.getById(input.cardId);
    if (!card) {
      throw new Error(`Card with id ${input.cardId} not found`);
    }

    const now = input.reviewDate || new Date();
    const previousState = card.fsrsState.state;

    // Run FSRS Engine schedule
    const scheduleResult = this.fsrsEngine.schedule(card.fsrsState, input.rating, now);
    const scheduledState = scheduleResult[input.rating].card;

    const updatedCard: CardEntity = {
      ...card,
      fsrsState: scheduledState,
      updatedAt: now.toISOString(),
    };

    await this.cardRepo.save(updatedCard);

    // Update deck card counts if state changed
    const deck = await this.deckRepo.getById(card.deckId);
    if (deck) {
      if (previousState === State.New && scheduledState.state !== State.New) {
        deck.newCardCount = Math.max(0, deck.newCardCount - 1);
      }
      deck.updatedAt = now.toISOString();
      await this.deckRepo.save(deck);
    }

    const xpEarned = XP_PER_RATING[input.rating] || 10;

    return {
      updatedCard,
      xpEarned,
      isDueForReview: new Date(scheduledState.due).getTime() <= now.getTime(),
    };
  }
}
