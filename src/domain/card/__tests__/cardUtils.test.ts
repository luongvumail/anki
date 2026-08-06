import { describe, expect, it } from 'vitest';
import { CardEntity } from '../cardEntity';
import { State } from '../../fsrs/fsrsTypes';
import {
  computeDueCount,
  computeLearnedCount,
  computeNewCount,
  computeReviewDueCount,
  getDeckMasteryPct,
  isDue,
} from '../cardUtils';

describe('cardUtils', () => {
  const pastDate = '2020-01-01T00:00:00Z';
  const futureDate = '2099-01-01T00:00:00Z';

  const newCard: CardEntity = {
    id: 'c1',
    deckId: 'd1',
    character: '好',
    pinyin: 'hǎo',
    translation: 'Tốt',
    examples: [],
    fsrs: {
      stability: 0,
      difficulty: 0,
      reps: 0,
      lapses: 0,
      state: State.New,
      last_review: null,
      due: pastDate,
    },
    createdAt: pastDate,
    updatedAt: pastDate,
  };

  const reviewDueCard: CardEntity = {
    id: 'c2',
    deckId: 'd1',
    character: '水',
    pinyin: 'shuǐ',
    translation: 'Nước',
    examples: [],
    fsrs: {
      stability: 5,
      difficulty: 4.5,
      reps: 3,
      lapses: 0,
      state: State.Review,
      last_review: pastDate,
      due: pastDate,
    },
    createdAt: pastDate,
    updatedAt: pastDate,
  };

  const learnedCard: CardEntity = {
    id: 'c3',
    deckId: 'd1',
    character: '火',
    pinyin: 'huǒ',
    translation: 'Lửa',
    examples: [],
    fsrs: {
      stability: 20,
      difficulty: 3.0,
      reps: 5,
      lapses: 0,
      state: State.Review,
      last_review: pastDate,
      due: futureDate,
    },
    createdAt: pastDate,
    updatedAt: pastDate,
  };

  const cards = [newCard, reviewDueCard, learnedCard];

  it('checks if a card is due correctly', () => {
    expect(isDue({ due: pastDate })).toBe(true);
    expect(isDue({ due: futureDate })).toBe(false);
  });

  it('computes due card count', () => {
    expect(computeDueCount(cards)).toBe(2);
  });

  it('computes new card count', () => {
    expect(computeNewCount(cards)).toBe(1);
  });

  it('computes review due count', () => {
    expect(computeReviewDueCount(cards)).toBe(1);
  });

  it('computes learned card count', () => {
    expect(computeLearnedCount(cards)).toBe(1);
  });

  it('computes deck mastery percentage', () => {
    expect(getDeckMasteryPct(3, 2, cards)).toBe(33);
  });
});
