import { ICardRepository } from "../../domain/card/cardRepository.i";

export class DeleteCardUseCase {
  private cardRepo: ICardRepository;

  constructor(cardRepo: ICardRepository) {
    this.cardRepo = cardRepo;
  }

  public async execute(cardId: string): Promise<void> {
    await this.cardRepo.deleteCard(cardId);
  }
}
