import { StateCreator } from "zustand";
import { isDue, FSRS_GRADES, FSRSGrade, FSRSState } from "../../lib/srs";
import { Card, StudySession } from "./types";
import { CardSlice } from "./cardSlice";

export interface SessionSlice {
  session: StudySession | null;
  startSession: (deckId: string) => Promise<void>;
  endSession: () => void;
  advanceSession: (card: Card, grade: FSRSGrade) => void;
}

export const createSessionSlice: StateCreator<SessionSlice & CardSlice, [], [], SessionSlice> = (
  set,
  get,
) => ({
  session: null,

  startSession: async (deckId) => {
    // 1. First attempt to fetch due cards using optimized server-side query
    let dueCards = await get().fetchDueCards(deckId);

    // 2. Fallback to loaded deck cards if fetchDueCards returned empty or wasn't cached
    if (dueCards.length === 0) {
      const cards =
        (get().cards[deckId] || []).length > 0
          ? get().cards[deckId]
          : await get().fetchCards(deckId);
      dueCards = cards.filter((c) => isDue(c.srs));
    }

    // Separate new cards and review cards by FSRS state
    const newCards = dueCards.filter(
      (c) => !c.srs || c.srs.state === FSRSState.New || c.srs.state === FSRSState.Learning,
    );
    const reviewCards = dueCards.filter(
      (c) => c.srs && c.srs.state !== FSRSState.New && c.srs.state !== FSRSState.Learning,
    );
    const queue = [...newCards, ...reviewCards];

    set({
      session: {
        deckId,
        queue,
        currentIndex: 0,
        reviewedCount: 0,
        correctCount: 0,
        startTime: new Date(),
      },
    });
  },

  endSession: () => set({ session: null }),

  advanceSession: (card, grade) => {
    set((s) => {
      if (!s.session) return { session: null };
      const updatedQueue = [...s.session.queue];
      if (grade === FSRS_GRADES.AGAIN) {
        const currentCards = s.cards[card.deckId] || [];
        const latestCard = currentCards.find((c) => c.id === card.id) || card;
        updatedQueue.push(latestCard);
      }
      return {
        session: {
          ...s.session,
          queue: updatedQueue,
          currentIndex: s.session.currentIndex + 1,
          reviewedCount: s.session.reviewedCount + 1,
          correctCount: grade >= 3 ? s.session.correctCount + 1 : s.session.correctCount,
        },
      };
    });
  },
});
