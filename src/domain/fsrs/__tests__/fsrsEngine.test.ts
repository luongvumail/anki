import { describe, expect, it } from 'vitest';
import { FSRSEngine } from '../fsrsEngine';
import { Rating, State } from '../fsrsTypes';

describe('FSRSEngine v5', () => {
  const engine = new FSRSEngine();
  const now = new Date('2026-08-06T10:00:00Z');

  it('creates an empty new card with default state', () => {
    const card = engine.createEmptyCard(now);
    expect(card.stability).toBe(0);
    expect(card.difficulty).toBe(0);
    expect(card.state).toBe(State.New);
    expect(card.reps).toBe(0);
    expect(card.last_review).toBeNull();
  });

  it('schedules a new card correctly for Good rating', () => {
    const card = engine.createEmptyCard(now);
    const result = engine.scheduleCard(card, Rating.Good, now);

    expect(result.card.reps).toBe(1);
    expect(result.card.state).toBe(State.Review);
    expect(result.card.stability).toBeGreaterThan(0);
    expect(result.card.difficulty).toBeGreaterThan(0);
    expect(result.card.last_review).toBe(now.toISOString());
  });

  it('increases stability on successive Good ratings and decreases on Again', () => {
    const emptyCard = engine.createEmptyCard(now);
    const firstReview = engine.scheduleCard(emptyCard, Rating.Good, now);
    const initialStability = firstReview.card.stability;

    // Review after 3 days
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 3600 * 1000);
    const secondReview = engine.scheduleCard(firstReview.card, Rating.Good, threeDaysLater);

    expect(secondReview.card.stability).toBeGreaterThan(initialStability);

    // Review with Again (failure)
    const nextFailure = engine.scheduleCard(secondReview.card, Rating.Again, threeDaysLater);
    expect(nextFailure.card.stability).toBeLessThan(secondReview.card.stability);
    expect(nextFailure.card.state).toBe(State.Relearning);
    expect(nextFailure.card.lapses).toBe(1);
  });

  it('calculates retrievability correctly', () => {
    const stability = 10;
    expect(engine.calculateRetrievability(0, stability)).toBe(1.0);
    expect(engine.calculateRetrievability(10, stability)).toBeLessThan(1.0);
    expect(engine.calculateRetrievability(10, stability)).toBeGreaterThan(0.4);
  });

  it('generates all 4 rating options via repeatCard', () => {
    const card = engine.createEmptyCard(now);
    const options = engine.repeatCard(card, now);

    expect(options[Rating.Again]).toBeDefined();
    expect(options[Rating.Hard]).toBeDefined();
    expect(options[Rating.Good]).toBeDefined();
    expect(options[Rating.Easy]).toBeDefined();

    expect(options[Rating.Easy].card.stability).toBeGreaterThan(options[Rating.Good].card.stability);
    expect(options[Rating.Good].card.stability).toBeGreaterThan(options[Rating.Hard].card.stability);
  });
});
