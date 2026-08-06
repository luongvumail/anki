import { z } from 'zod';
import { Rating, State } from '../../domain/fsrs/fsrsTypes';

export const RatingSchema = z.nativeEnum(Rating);
export const StateSchema = z.nativeEnum(State);

export const FSRSCardStateSchema = z.object({
  stability: z.number().min(0),
  difficulty: z.number().min(1).max(10),
  reps: z.number().int().min(0),
  lapses: z.number().int().min(0),
  state: StateSchema,
  last_review: z.string().nullable(),
  due: z.string(),
});

export const LegacySRSStateSchema = z.object({
  repetitions: z.number().int(),
  interval: z.number(),
  easeFactor: z.number(),
  dueDate: z.string(),
});

export const ExampleSentenceSchema = z.object({
  chinese: z.string().min(1),
  pinyin: z.string().min(1),
  vietnamese: z.string().min(1),
});

export const CardEntitySchema = z.object({
  id: z.string().min(1),
  deckId: z.string().min(1),
  character: z.string().min(1),
  traditional: z.string().optional(),
  pinyin: z.string().min(1),
  hanviet: z.string().optional(),
  translation: z.string().min(1),
  examples: z.array(ExampleSentenceSchema).default([]),
  radical: z.string().optional(),
  strokeCount: z.number().optional(),
  hskLevel: z.number().optional(),
  tags: z.array(z.string()).optional(),
  fsrs: FSRSCardStateSchema.optional(),
  srs: LegacySRSStateSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastReviewedAt: z.string().optional(),
});

export const GenerateAICardsPayloadSchema = z.object({
  topic: z.string().min(1),
  count: z.number().int().min(1).max(20).default(5),
  hskLevel: z.number().int().min(1).max(6).optional(),
});

export const AICardResponseItemSchema = z.object({
  character: z.string().min(1),
  traditional: z.string().optional(),
  pinyin: z.string().min(1),
  hanviet: z.string().optional(),
  translation: z.string().min(1),
  examples: z.array(ExampleSentenceSchema).default([]),
  radical: z.string().optional(),
  strokeCount: z.number().optional(),
  hskLevel: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

export const AICardListResponseSchema = z.array(AICardResponseItemSchema);

export const ReviewLogSchema = z.object({
  rating: RatingSchema,
  state: StateSchema,
  due: z.string(),
  stability: z.number(),
  difficulty: z.number(),
  elapsed_days: z.number(),
  scheduled_days: z.number(),
  review: z.string(),
});

export const SyncOfflinePayloadSchema = z.object({
  cardId: z.string().min(1),
  deckId: z.string().min(1),
  cardState: FSRSCardStateSchema,
  reviewLog: ReviewLogSchema,
  timestamp: z.string(),
});
