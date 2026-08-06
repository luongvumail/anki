import { CardEntity, ExampleSentence } from "../../domain/card/cardEntity";
import { ICardRepository } from "../../domain/card/cardRepository.i";
import { FSRSEngine } from "../../domain/fsrs/fsrsEngine";

export interface AddCardInput {
  deckId: string;
  character: string;
  pinyin?: string;
  traditional?: string;
  hanviet?: string;
  translation?: string;
  examples?: ExampleSentence[];
  radical?: string;
  strokeCount?: number;
  hskLevel?: number;
  tags?: string[];
  fsrs?: CardEntity["fsrs"];
}

function generateId(prefix: string): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return `${prefix}-${crypto.randomUUID()}`;
    }
  } catch {}
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export class AddCardUseCase {
  private cardRepo: ICardRepository;
  private fsrsEngine: FSRSEngine;

  constructor(cardRepo: ICardRepository, fsrsEngine: FSRSEngine = new FSRSEngine()) {
    this.cardRepo = cardRepo;
    this.fsrsEngine = fsrsEngine;
  }

  public async execute(input: AddCardInput): Promise<CardEntity> {
    const now = new Date();
    const nowStr = now.toISOString();
    const initialFSRS = input.fsrs ?? this.fsrsEngine.createEmptyCard(now);

    const newCard: CardEntity = {
      ...input,
      id: generateId("card"),
      character: input.character || "",
      pinyin: input.pinyin || "",
      translation: input.translation || "",
      examples: input.examples || [],
      tags: input.tags || [],
      fsrs: initialFSRS,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    await this.cardRepo.saveCard(newCard);
    return newCard;
  }
}
