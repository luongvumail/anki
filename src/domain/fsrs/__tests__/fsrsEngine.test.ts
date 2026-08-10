import { describe, expect, it } from "vitest";
import { FSRSEngine } from "../fsrsEngine.js";
import { Rating, State } from "../fsrsTypes.js";

describe("FSRSEngine (FSRS v5 Math Engine)", () => {
  const engine = new FSRSEngine();

  it("should create default blank card state with State.New", () => {
    const card = engine.createNewCardState();
    expect(card.state).toBe(State.New);
    expect(card.reps).toBe(0);
    expect(card.lapses).toBe(0);
    expect(card.stability).toBe(0);
    expect(card.difficulty).toBe(0);
  });

  it("should transition new card to State.Review and increase stability after Good rating", () => {
    const card = engine.createNewCardState();
    const now = new Date("2026-08-10T10:00:00Z");
    const result = engine.schedule(card, Rating.Good, now);
    const scheduledCard = result[Rating.Good].card;

    expect(scheduledCard.state).toBe(State.Review);
    expect(scheduledCard.reps).toBe(1);
    expect(scheduledCard.stability).toBeGreaterThan(0);
    expect(scheduledCard.difficulty).toBeGreaterThan(0);
    expect(new Date(scheduledCard.due).getTime()).toBeGreaterThan(now.getTime());
  });

  it("should transition new card to State.Learning after Again rating", () => {
    const card = engine.createNewCardState();
    const now = new Date("2026-08-10T10:00:00Z");
    const result = engine.schedule(card, Rating.Again, now);
    const scheduledCard = result[Rating.Again].card;

    expect(scheduledCard.state).toBe(State.Learning);
    expect(scheduledCard.reps).toBe(1);
    expect(scheduledCard.lapses).toBe(0);
  });

  it("should increment lapses and set State.Relearning on Review card when rated Again", () => {
    const now = new Date("2026-08-10T10:00:00Z");
    const reviewCard = {
      stability: 5.0,
      difficulty: 4.5,
      reps: 3,
      lapses: 1,
      state: State.Review,
      last_review: "2026-08-05T10:00:00Z",
      due: "2026-08-10T10:00:00Z",
    };

    const result = engine.schedule(reviewCard, Rating.Again, now);
    const scheduledCard = result[Rating.Again].card;

    expect(scheduledCard.state).toBe(State.Relearning);
    expect(scheduledCard.lapses).toBe(2);
    expect(scheduledCard.reps).toBe(4);
  });
});
