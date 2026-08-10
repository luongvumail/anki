import { DEFAULT_FSRS_PARAMETERS } from "./fsrsConstants.js";
import {
  FSRSCardState,
  FSRSItemScheduling,
  FSRSParameters,
  FSRSScheduleResult,
  Rating,
  ReviewLog,
  State,
} from "./fsrsTypes.js";

/**
 * FSRS v5 Math & Scheduling Engine
 * Pure TypeScript implementation of Free Spaced Repetition Scheduler v5.
 */
export class FSRSEngine {
  private params: FSRSParameters;

  constructor(params: FSRSParameters = DEFAULT_FSRS_PARAMETERS) {
    this.params = params;
  }

  /**
   * Retrievability R(t, S) - predicted probability of recall after t days.
   */
  public calculateRetrievability(elapsedDays: number, stability: number): number {
    if (stability <= 0) return 0;
    if (elapsedDays <= 0) return 1.0;
    const r = Math.pow(1 + elapsedDays / (9 * stability), -1);
    return Math.min(1.0, Math.max(0.0, r));
  }

  /**
   * Next interval in days given stability.
   */
  public calculateNextInterval(stability: number): number {
    const rTarget = this.params.request_retention;
    const maxInterval = this.params.maximum_interval;
    const intervalDays = 9 * stability * (1 / rTarget - 1);
    const rounded = Math.round(intervalDays);
    return Math.max(1, Math.min(maxInterval, rounded));
  }

  /**
   * Initial stability for new card based on first rating.
   */
  private initInitialStability(rating: Rating): number {
    const w = this.params.w;
    switch (rating) {
      case Rating.Again:
        return Math.max(0.1, w[0]);
      case Rating.Hard:
        return Math.max(0.1, w[1]);
      case Rating.Good:
        return Math.max(0.1, w[2]);
      case Rating.Easy:
        return Math.max(0.1, w[3]);
      default:
        return w[2];
    }
  }

  /**
   * Initial difficulty for new card (scale 1-10).
   */
  private initInitialDifficulty(rating: Rating): number {
    const w = this.params.w;
    const d0 = w[4] - Math.exp(w[5] * (rating - 1)) + 1;
    return this.clampDifficulty(d0);
  }

  /**
   * Update difficulty after review.
   */
  private updateDifficulty(currentD: number, rating: Rating): number {
    const w = this.params.w;
    const initD3 = w[4] - Math.exp(w[5] * (Rating.Good - 1)) + 1;
    const deltaD = currentD - w[6] * (rating - 3);
    const meanRevertedD = w[7] * initD3 + (1 - w[7]) * deltaD;
    return this.clampDifficulty(meanRevertedD);
  }

  /**
   * Update stability after successful recall (Rating >= Hard).
   */
  private nextRecallStability(d: number, s: number, r: number, rating: Rating): number {
    const w = this.params.w;
    const hardPenalty = rating === Rating.Hard ? w[11] : 1.0;
    const easyBonus = rating === Rating.Easy ? w[12] : 1.0;
    const recallInc =
      1 +
      Math.exp(w[8]) *
        (11 - d) *
        Math.pow(s, -w[9]) *
        (Math.exp(w[10] * (1 - r)) - 1) *
        hardPenalty *
        easyBonus;
    return Math.max(0.1, s * recallInc);
  }

  /**
   * Update stability after forgetting (Rating = Again).
   */
  private nextForgetStability(d: number, s: number, r: number): number {
    const w = this.params.w;
    const forgetS =
      w[13] *
      Math.pow(d, -w[14]) *
      (Math.pow(s + 1, w[15]) - 1) *
      Math.exp(w[16] * (1 - r));
    return Math.max(0.1, Math.min(s, forgetS));
  }

  private clampDifficulty(d: number): number {
    return Math.min(10.0, Math.max(1.0, d));
  }

  /**
   * Creates initial blank card state for a brand new card.
   */
  public createNewCardState(): FSRSCardState {
    return {
      stability: 0,
      difficulty: 0,
      reps: 0,
      lapses: 0,
      state: State.New,
      last_review: null,
      due: new Date().toISOString(),
    };
  }

  /**
   * Schedules a card review given rating and review date.
   */
  public schedule(
    card: FSRSCardState,
    rating: Rating,
    now: Date = new Date()
  ): FSRSScheduleResult {
    const ratings = [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy];
    const results = {} as FSRSScheduleResult;

    for (const r of ratings) {
      results[r] = this.scheduleForRating(card, r, now);
    }

    return results;
  }

  private scheduleForRating(
    card: FSRSCardState,
    rating: Rating,
    now: Date
  ): FSRSItemScheduling {
    const nowIso = now.toISOString();

    let newS = 0;
    let newD = 0;
    let newState = State.Review;
    let newLapses = card.lapses;

    const elapsedDays = card.last_review
      ? Math.max(0, (now.getTime() - new Date(card.last_review).getTime()) / (1000 * 3600 * 24))
      : 0;

    if (card.state === State.New) {
      newS = this.initInitialStability(rating);
      newD = this.initInitialDifficulty(rating);
      newState = rating === Rating.Again ? State.Learning : State.Review;
    } else {
      const currentR = this.calculateRetrievability(elapsedDays, card.stability);
      newD = this.updateDifficulty(card.difficulty, rating);

      if (rating === Rating.Again) {
        newS = this.nextForgetStability(newD, card.stability, currentR);
        newState = State.Relearning;
        newLapses += 1;
      } else {
        newS = this.nextRecallStability(newD, card.stability, currentR, rating);
        newState = State.Review;
      }
    }

    const intervalDays = rating === Rating.Again ? 1 : this.calculateNextInterval(newS);
    const dueDate = new Date(now.getTime() + intervalDays * 24 * 3600 * 1000);

    const updatedCard: FSRSCardState = {
      stability: Number(newS.toFixed(4)),
      difficulty: Number(newD.toFixed(4)),
      reps: card.reps + 1,
      lapses: newLapses,
      state: newState,
      last_review: nowIso,
      due: dueDate.toISOString(),
    };

    const reviewLog: ReviewLog = {
      rating,
      state: card.state,
      due: card.due,
      stability: card.stability,
      difficulty: card.difficulty,
      elapsed_days: elapsedDays,
      scheduled_days: intervalDays,
      review: nowIso,
    };

    return { card: updatedCard, log: reviewLog };
  }
}
