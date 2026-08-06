/**
 * FSRS v5 Domain Types
 * Pure TypeScript types with zero runtime dependencies.
 */

export enum Rating {
  Again = 1,
  Hard = 2,
  Good = 3,
  Easy = 4,
}

export enum State {
  New = 0,
  Learning = 1,
  Review = 2,
  Relearning = 3,
}

export interface FSRSParameters {
  /** Target retrievability (default: 0.90 = 90% target retention) */
  request_retention: number;
  /** Maximum interval in days (default: 36500) */
  maximum_interval: number;
  /** FSRS v5 19 weight parameters */
  w: number[];
}

export interface FSRSCardState {
  /** Stability (S) in days */
  stability: number;
  /** Difficulty (D) on scale 1-10 */
  difficulty: number;
  /** Number of total reviews */
  reps: number;
  /** Number of lapses (times rating was Again on a Review card) */
  lapses: number;
  /** Current memory state */
  state: State;
  /** ISO Date string or Timestamp of last review */
  last_review: string | null;
  /** ISO Date string or Timestamp when card is due */
  due: string;
}

export interface ReviewLog {
  rating: Rating;
  state: State;
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  review: string;
}

export interface FSRSItemScheduling {
  card: FSRSCardState;
  log: ReviewLog;
}

export interface FSRSScheduleResult {
  1: FSRSItemScheduling; // Again
  2: FSRSItemScheduling; // Hard
  3: FSRSItemScheduling; // Good
  4: FSRSItemScheduling; // Easy
}
