import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDeckSlice } from '../deckSlice';
import { DeckEntity } from '../../../../domain/deck/deckEntity';

vi.mock('../../../../infrastructure/persistence/firestoreRepo', () => {
  return {
    FirestoreDeckRepository: class {
      getDecks = vi.fn().mockResolvedValue([
        {
          id: 'deck-1',
          name: 'HSK 1',
          description: 'Basic vocabulary',
          cardCount: 10,
          newCount: 2,
          dueCount: 3,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ]);
      saveDeck = vi.fn().mockResolvedValue(undefined);
      deleteDeck = vi.fn().mockResolvedValue(undefined);
    },
  };
});

describe('deckSlice', () => {
  let storeState: any;
  let set: any;
  let get: any;

  beforeEach(() => {
    storeState = {
      decks: [],
      isDeckLoading: false,
      deckError: null,
      cards: {},
    };
    set = (fn: any) => {
      const next = typeof fn === 'function' ? fn(storeState) : fn;
      Object.assign(storeState, next);
    };
    get = () => storeState;
  });

  it('fetches decks successfully and updates isDeckLoading state', async () => {
    const slice = createDeckSlice(set, get, {} as any);
    await slice.fetchDecks();

    expect(storeState.isDeckLoading).toBe(false);
    expect(storeState.decks).toHaveLength(1);
    expect(storeState.decks[0].name).toBe('HSK 1');
  });

  it('creates a new deck optimistically', async () => {
    const slice = createDeckSlice(set, get, {} as any);
    const newDeckId = await slice.createDeck({
      name: 'HSK 2',
      description: 'Intermediate',
      color: '#1CB0F6',
      icon: 'book-outline',
    });

    expect(newDeckId).toBeDefined();
    expect(storeState.decks).toHaveLength(1);
    expect(storeState.decks[0].name).toBe('HSK 2');
  });

  it('deletes a deck from local state', async () => {
    storeState.decks = [
      { id: 'deck-1', name: 'HSK 1' } as DeckEntity,
      { id: 'deck-2', name: 'HSK 2' } as DeckEntity,
    ];
    storeState.cards = { 'deck-1': [], 'deck-2': [] };

    const slice = createDeckSlice(set, get, {} as any);
    await slice.deleteDeck('deck-1');

    expect(storeState.decks).toHaveLength(1);
    expect(storeState.decks[0].id).toBe('deck-2');
    expect(storeState.cards['deck-1']).toBeUndefined();
  });
});
