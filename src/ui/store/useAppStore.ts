import { Rating } from "../../domain/fsrs/fsrsTypes.js";
import { createCardSlice } from "./slices/cardSlice.js";
import { createDeckSlice } from "./slices/deckSlice.js";
import { createProgressSlice } from "./slices/progressSlice.js";
import { createUISlice } from "./slices/uiSlice.js";
import { AppStoreState } from "./types.js";

class AppStore {
  private listeners: Set<() => void> = new Set();
  private state: AppStoreState;

  constructor() {
    let cardSliceObj: ReturnType<typeof createCardSlice>;
    let deckSliceObj: ReturnType<typeof createDeckSlice>;
    let progressSliceObj: ReturnType<typeof createProgressSlice>;
    let uiSliceObj: ReturnType<typeof createUISlice>;

    const setFn = (fn: any) => {
      const partial = fn(this.state);
      this.state = { ...this.state, ...partial };
      this.notify();
    };

    const getFn = () => this.state;

    cardSliceObj = createCardSlice(setFn, getFn as any);
    deckSliceObj = createDeckSlice(setFn);
    progressSliceObj = createProgressSlice(setFn, getFn as any);
    uiSliceObj = createUISlice(setFn);

    this.state = {
      ...cardSliceObj,
      ...deckSliceObj,
      ...progressSliceObj,
      ...uiSliceObj,
    };
  }

  public getState(): AppStoreState {
    return this.state;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Backward compatibility convenience methods
  public loadDecks() {
    return this.state.loadDecks();
  }

  public fetchCards(deckId: string) {
    return this.state.fetchCards(deckId);
  }

  public addCard(cardData: any) {
    return this.state.addCard(cardData);
  }

  public updateCard(cardId: string, deckId: string, updates: any) {
    return this.state.updateCard(cardId, deckId, updates);
  }

  public resetDeckProgress(deckId: string) {
    return this.state.resetDeckProgress(deckId);
  }

  public deleteCard(cardId: string, deckId: string) {
    return this.state.deleteCard(cardId, deckId);
  }

  public processReview(card: any, rating: Rating) {
    return this.state.processReview(card, rating);
  }

  public addDeck(title: string, description: string, color?: string) {
    return this.state.addDeck(title, description, color);
  }

  public deleteDeck(deckId: string) {
    return this.state.deleteDeck(deckId);
  }

  public addXp(amount: number) {
    return this.state.addXp(amount);
  }

  public updateStreak(date?: Date) {
    return this.state.updateStreak(date);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }
}

export const appStore = new AppStore();
export const useAppStore = appStore;
