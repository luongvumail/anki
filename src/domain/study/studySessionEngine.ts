import { CardEntity } from "../card/cardEntity.js";
import { getDueCards, sortByDue } from "../card/cardUtils.js";
import { State } from "../fsrs/fsrsTypes.js";

export interface StudyQueue {
  newCards: CardEntity[];
  reviewCards: CardEntity[];
  learningCards: CardEntity[];
}

export class StudySessionEngine {
  /**
   * Categorizes cards into New, Review, and Learning queues for a study session.
   */
  public prepareSessionQueue(cards: CardEntity[], now: Date = new Date()): StudyQueue {
    const dueCards = getDueCards(cards, now);
    const sorted = sortByDue(dueCards);

    const newCards: CardEntity[] = [];
    const reviewCards: CardEntity[] = [];
    const learningCards: CardEntity[] = [];

    for (const card of sorted) {
      if (card.fsrsState.state === State.New) {
        newCards.push(card);
      } else if (
        card.fsrsState.state === State.Learning ||
        card.fsrsState.state === State.Relearning
      ) {
        learningCards.push(card);
      } else {
        reviewCards.push(card);
      }
    }

    return { newCards, reviewCards, learningCards };
  }
}
