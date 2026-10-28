/**
 * Real SM-2 spaced repetition (SuperMemo 2).
 * quality 0–5: <3 = forgot (repetitions reset, review again tomorrow).
 */
export type SrsState = {
  easiness: number; // EF, >= 1.3
  interval: number; // days until next review
  repetitions: number; // consecutive successful reviews
};

export const DEFAULT_SRS: SrsState = {
  easiness: 2.5,
  interval: 0,
  repetitions: 0,
};

/**
 * Applies one SM-2 review.
 * @param {SrsState} prev - Previous state
 * @param {number} quality - Recall quality 0–5
 * @return {SrsState} Next state
 */
export function sm2(prev: SrsState, quality: number): SrsState {
  const q = Math.max(0, Math.min(5, Math.round(quality)));
  let {easiness, interval, repetitions} = {...DEFAULT_SRS, ...prev};

  if (q < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    else interval = Math.round(interval * easiness);
  }

  easiness = easiness + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (easiness < 1.3) easiness = 1.3;

  return {easiness: Number(easiness.toFixed(2)), interval, repetitions};
}

/**
 * A 0–100 "strength" for the UI, derived from SM-2 state.
 * @param {SrsState} s - SM-2 state
 * @return {number} Strength 0–100
 */
export function strengthOf(s: SrsState): number {
  if (!s.repetitions) return 0;
  // ~21 days interval ≈ mastered
  return Math.min(100, Math.round((Math.log2(1 + s.interval) / 4.46) * 100));
}

/**
 * Legacy helper kept for compatibility with old callers.
 * @param {number} prev - Previous strength (0–100)
 * @param {number} quality - Response quality 0–5
 * @return {number} New strength 0–100
 */
export function updateStrength(prev: number, quality: number): number {
  if (quality < 3) return 0;
  return Math.min(prev + quality * 4, 100);
}
