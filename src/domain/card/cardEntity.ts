import { FSRSCardState, State } from "../fsrs/fsrsTypes";

export interface ExampleSentence {
  chinese: string;
  pinyin: string;
  vietnamese: string;
}

export interface LegacySRSState {
  repetitions: number;
  interval: number;
  easeFactor: number;
  dueDate: string;
}

export interface CardEntity {
  id: string;
  deckId: string;
  character: string;
  traditional?: string;
  pinyin: string;
  hanviet?: string;
  translation: string;
  examples: ExampleSentence[];
  radical?: string;
  strokeCount?: number;
  hskLevel?: number;
  tags?: string[];
  /** FSRS v5 Card State */
  fsrs?: FSRSCardState;
  /** Legacy SM-2 SRS state for backward compatibility */
  srs?: LegacySRSState;
  createdAt: string;
  updatedAt: string;
  lastReviewedAt?: string;
}

/**
 * Converts legacy SM-2 SRS state to initial FSRS state if fsrs state doesn't exist yet.
 */
export function ensureFSRSState(card: CardEntity, now: Date = new Date()): FSRSCardState {
  if (card.fsrs) {
    return card.fsrs;
  }

  // Convert legacy srs if present
  if (card.srs) {
    const isNew = card.srs.repetitions === 0;
    // Map initial SM-2 ease factor & interval to FSRS S & D estimation
    const initialStability = Math.max(0.1, card.srs.interval > 0 ? card.srs.interval : 1.0);
    // SM-2 EaseFactor 2.5 corresponds to approx difficulty 5.0 in FSRS (range 1-10)
    const initialDifficulty = Math.min(10.0, Math.max(1.0, 11 - (card.srs.easeFactor / 2.5) * 6));

    return {
      stability: Number(initialStability.toFixed(4)),
      difficulty: Number(initialDifficulty.toFixed(4)),
      reps: card.srs.repetitions,
      lapses: 0,
      state: isNew ? State.New : State.Review,
      last_review: card.lastReviewedAt ?? null,
      due: card.srs.dueDate || now.toISOString(),
    };
  }

  // Default empty FSRS card state
  return {
    stability: 0,
    difficulty: 0,
    reps: 0,
    lapses: 0,
    state: State.New,
    last_review: null,
    due: now.toISOString(),
  };
}
