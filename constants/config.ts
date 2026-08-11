/**
 * Global App Configurations & Magic Numbers
 */

export const APP_CONFIG = {
  // Splash & Auth transitions
  SPLASH_MIN_DISPLAY_MS: 1500,
  SPLASH_FADE_MS: 450,
  LOGOUT_FADE_MS: 400,
  LOGOUT_SPLASH_DELAY_MS: 250,

  // Pagination & Session limits
  PAGE_SIZE: 20,
  MAX_SESSION_CARDS: 10,

  // SRS & Study Thresholds
  SLOW_RESPONSE_THRESHOLD_MS: 3500,
  REPAIR_SLOW_THRESHOLD_MS: 4000,
  DEFAULT_EASE_FACTOR: 2.5,
  MIN_EASE_FACTOR: 1.3,

  // Debounce & Timeout
  GEMINI_DEBOUNCE_MS: 500,

  // User Levels (XP required per level step)
  XP_PER_LEVEL: 100,
} as const;
