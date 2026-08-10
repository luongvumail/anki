import { FSRSParameters } from "./fsrsTypes.js";

/**
 * FSRS v5 Default Weights (19 parameters optimized for general spaced repetition)
 */
export const DEFAULT_WEIGHTS: number[] = [
  0.40255, // w0: initial stability for Again
  1.18385, // w1: initial stability for Hard
  3.173,   // w2: initial stability for Good
  15.69105,// w3: initial stability for Easy
  7.1949,  // w4: initial difficulty mean
  0.5345,  // w5: initial difficulty step
  1.4604,  // w6: difficulty update delta multiplier
  0.0046,  // w7: mean reversion weight
  1.5457,  // w8: stability recall base
  0.1192,  // w9: stability recall exponent D
  1.0192,  // w10: stability recall exponent R
  1.9395,  // w11: Hard penalty multiplier
  0.11,    // w12: Easy bonus multiplier
  0.2968,  // w13: Forget stability base
  2.2698,  // w14: Forget stability exponent D
  0.2315,  // w15: Forget stability exponent S
  2.9898,  // w16: Forget stability exponent R
  0.5165,  // w17: Short-term stability factor
  0.6621,  // w18: Decay parameter
];

export const DEFAULT_FSRS_PARAMETERS: FSRSParameters = {
  request_retention: 0.9,
  maximum_interval: 36500,
  w: DEFAULT_WEIGHTS,
};
