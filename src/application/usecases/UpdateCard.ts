import { CardEntity } from "../../domain/card/cardEntity";
import { ICardRepository } from "../../domain/card/cardRepository.i";

export interface UpdateCardInput {
  targetCard: CardEntity;
  updates: Partial<CardEntity>;
}

export class UpdateCardUseCase {
  private cardRepo: ICardRepository;

  constructor(cardRepo: ICardRepository) {
    this.cardRepo = cardRepo;
  }

  public async execute(input: UpdateCardInput): Promise<CardEntity> {
    const updatedCard: CardEntity = {
      ...input.targetCard,
      ...input.updates,
      updatedAt: new Date().toISOString(),
    };

    await this.cardRepo.saveCard(updatedCard);
    return updatedCard;
  }
}
