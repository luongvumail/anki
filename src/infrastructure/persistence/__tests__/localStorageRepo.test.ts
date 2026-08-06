import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalStorageRepo, SyncOfflinePayload } from '../localStorageRepo';
import AsyncStorage from '@react-native-async-storage/async-storage';

vi.mock('@react-native-async-storage/async-storage', () => {
  let store: Record<string, string> = {};
  return {
    default: {
      getItem: vi.fn(async (key: string) => store[key] || null),
      setItem: vi.fn(async (key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn(async (key: string) => {
        delete store[key];
      }),
      clear: vi.fn(async () => {
        store = {};
      }),
    },
  };
});

describe('LocalStorageRepo', () => {
  let repo: LocalStorageRepo;

  beforeEach(async () => {
    await AsyncStorage.clear();
    repo = new LocalStorageRepo();
  });

  it('enqueues and retrieves offline review payloads', async () => {
    const payload: SyncOfflinePayload = {
      id: 'offline-1',
      cardId: 'card-123',
      deckId: 'deck-456',
      card: {
        id: 'card-123',
        deckId: 'deck-456',
        character: '水',
        pinyin: 'shuǐ',
        translation: 'Water',
        examples: [],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      reviewLog: {
        rating: 3,
        state: 0,
        due: '2026-01-02T00:00:00Z',
        stability: 2.5,
        difficulty: 5.0,
        elapsed_days: 0,
        scheduled_days: 1,
        review: '2026-01-01T00:00:00Z',
      },
      timestamp: '2026-01-01T00:00:00Z',
    };

    await repo.enqueueOfflineReview(payload);
    const queue = await repo.getOfflineQueue();

    expect(queue).toHaveLength(1);
    expect(queue[0].id).toBe('offline-1');
  });

  it('removes synced items from offline queue', async () => {
    const p1: SyncOfflinePayload = {
      id: 'offline-1',
      cardId: 'card-1',
      deckId: 'deck-1',
      card: {} as any,
      reviewLog: {} as any,
      timestamp: '2026-01-01T00:00:00Z',
    };
    const p2: SyncOfflinePayload = {
      id: 'offline-2',
      cardId: 'card-2',
      deckId: 'deck-1',
      card: {} as any,
      reviewLog: {} as any,
      timestamp: '2026-01-01T00:00:00Z',
    };

    await repo.enqueueOfflineReview(p1);
    await repo.enqueueOfflineReview(p2);

    await repo.removeOfflineReviews(['offline-1']);
    const remaining = await repo.getOfflineQueue();

    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('offline-2');
  });
});
