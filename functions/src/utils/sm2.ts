/**
 * SM-2–style strength update for vocabulary retention.
 * quality: 0–5 (e.g. user rating). If quality < 3, reset; else increase.
 * @param {number} prev - Previous strength (0–100)
 * @param {number} quality - Response quality 0–5
 * @return {number} New strength 0–100
 */
export function updateStrength(prev: number, quality: number): number {
  if (quality < 3) return 0;
  return Math.min(prev + quality, 100);
}
