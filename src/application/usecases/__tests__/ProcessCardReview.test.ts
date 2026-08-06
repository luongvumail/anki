import { describe, expect, it } from 'vitest';
import { CardEntity } from '../../../domain/card/cardEntity';
import { Rating, State } from '../../../domain/fsrs/fsrsTypes';
import { ProcessCardReviewUseCase } from '../ProcessCardReview';

describe('ProcessCardReviewUseCase', () => {
  const useCase = new ProcessCardReviewUseCase();

  const testCard: CardEntity = {
    id: 'card-1',
    deckId: 'deck-1',
    character: '你好',
    pinyin: 'nǐ hǎo',
    translation: 'Hello',
    examples: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('processes card review and updates FSRS state and XP correctly', () => {
    const now = new Date('2026-08-06T10:00:00Z');
    const streak = { currentStreak: 1, longestStreak: 1, lastStudyDate: '2026-08-05' };

    const result = useCase.execute({
      card: testCard,
      rating: Rating.Good,
      now,
      currentStreak: streak,
    });

    expect(result.updatedCard.fsrs).toBeDefined();
    expect(result.updatedCard.fsrs?.state).toBe(State.Review);
    expect(result.earnedXP).toBe(10);
    expect(result.newStreak?.currentStreak).toBe(2);
    expect(result.reviewLog.rating).toBe(Rating.Good);
  });
});
