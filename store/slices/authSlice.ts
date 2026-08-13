import { StateCreator } from "zustand";
import { DeckSlice } from "./deckSlice";
import { CardSlice } from "./cardSlice";
import { SessionSlice } from "./sessionSlice";
import { UserProgressState } from "./types";
import { clearReviewTrackerCache } from "../../lib/reviewTracker";

export interface AuthSlice {
  userId: string | null;
  setUserId: (id: string | null) => void;
  resetUserState: () => void;
}

export const createAuthSlice: StateCreator<
  AuthSlice & DeckSlice & CardSlice & SessionSlice & UserProgressState,
  [],
  [],
  AuthSlice
> = (set) => ({
  userId: null,
  setUserId: (id) => set({ userId: id }),
  resetUserState: () => {
    clearReviewTrackerCache();
    set({
      userId: null,
      decks: [],
      cards: {},
      session: null,
      xp: 0,
      unlockedBadgeIds: [],
    });
  },
});
