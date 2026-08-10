import { AddCardUseCase } from "../application/usecases/AddCard.js";
import { DeleteCardUseCase } from "../application/usecases/DeleteCard.js";
import { GenerateQuizUseCase } from "../application/usecases/GenerateQuiz.js";
import { ProcessCardReviewUseCase } from "../application/usecases/ProcessCardReview.js";
import { ResetDeckProgressUseCase } from "../application/usecases/ResetDeckProgress.js";
import { SyncOfflineQueueUseCase } from "../application/usecases/SyncOfflineQueue.js";
import { UpdateCardUseCase } from "../application/usecases/UpdateCard.js";
import { FSRSEngine } from "../domain/fsrs/fsrsEngine.js";
import { FirestoreCardRepository } from "./persistence/firestoreRepo.js";
import {
  LocalStorageCardRepository,
  LocalStorageDeckRepository,
} from "./persistence/localStorageRepo.js";

export function createContainer() {
  const cardRepo = new LocalStorageCardRepository();
  const deckRepo = new LocalStorageDeckRepository();
  const cloudCardRepo = new FirestoreCardRepository();
  const fsrsEngine = new FSRSEngine();

  return {
    cardRepo,
    deckRepo,
    cloudCardRepo,
    fsrsEngine,
    addCard: new AddCardUseCase(cardRepo, deckRepo, fsrsEngine),
    updateCard: new UpdateCardUseCase(cardRepo),
    deleteCard: new DeleteCardUseCase(cardRepo, deckRepo),
    processCardReview: new ProcessCardReviewUseCase(cardRepo, deckRepo, fsrsEngine),
    generateQuiz: new GenerateQuizUseCase(cardRepo),
    resetDeckProgress: new ResetDeckProgressUseCase(cardRepo, deckRepo, fsrsEngine),
    syncOfflineQueue: new SyncOfflineQueueUseCase(cardRepo, cloudCardRepo),
  };
}

export const container = createContainer();
