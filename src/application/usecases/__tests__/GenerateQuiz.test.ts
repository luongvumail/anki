import { describe, expect, it } from 'vitest';
import { CardEntity } from '../../../domain/card/cardEntity';
import { generateQuizQuestion } from '../GenerateQuiz';

describe('GenerateQuiz', () => {
  const mockCard: CardEntity = {
    id: 'c1',
    deckId: 'd1',
    character: '你好',
    pinyin: 'nǐ hǎo',
    translation: 'Xin chào',
    examples: [
      {
        chinese: '你好！很高兴认识你。',
        pinyin: 'Nǐ hǎo! Hěn gāoxìng rènshí nǐ.',
        vietnamese: 'Xin chào! Rất vui được gặp bạn.',
      },
    ],
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
  };

  const poolCards: CardEntity[] = [
    mockCard,
    {
      id: 'c2',
      deckId: 'd1',
      character: '谢谢',
      pinyin: 'xiè xie',
      translation: 'Cảm ơn',
      examples: [],
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z',
    },
    {
      id: 'c3',
      deckId: 'd1',
      character: '再见',
      pinyin: 'zài jiàn',
      translation: 'Tạm biệt',
      examples: [],
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z',
    },
  ];

  it('generates a valid quiz question for a card', () => {
    const question = generateQuizQuestion(mockCard, poolCards);
    expect(question).not.toBeNull();
    if (question) {
      expect(question.card.id).toBe('c1');
      expect(question.options.length).toBeGreaterThanOrEqual(1);
      expect(question.options).toContain(question.correctAnswer);
    }
  });

  it('includes the correct answer in options for meaning_choice or pinyin_choice', () => {
    for (let i = 0; i < 10; i++) {
      const question = generateQuizQuestion(mockCard, poolCards);
      if (question) {
        expect(question.options).toContain(question.correctAnswer);
      }
    }
  });
});
