import { describe, expect, it } from 'vitest';
import { CardEntity, ensureFSRSState } from '../cardEntity';
import { State } from '../../fsrs/fsrsTypes';

describe('CardEntity SM-2 to FSRS Migration', () => {
  it('converts legacy SM-2 srs state into FSRS card state correctly', () => {
    const legacyCard: CardEntity = {
      id: 'card-legacy-1',
      deckId: 'deck-1',
      character: '汉字',
      pinyin: 'hàn zì',
      translation: 'Kanji / Chinese character',
      examples: [],
      srs: {
        repetitions: 3,
        interval: 12,
        easeFactor: 2.5,
        dueDate: '2026-08-18T10:00:00Z',
      },
      createdAt: '2026-08-01T10:00:00Z',
      updatedAt: '2026-08-01T10:00:00Z',
    };

    const fsrs = ensureFSRSState(legacyCard);

    expect(fsrs.stability).toBe(12);
    expect(fsrs.difficulty).toBe(5);
    expect(fsrs.reps).toBe(3);
    expect(fsrs.state).toBe(State.Review);
    expect(fsrs.due).toBe('2026-08-18T10:00:00Z');
  });
});
