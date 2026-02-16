/**
 * Generates searchable keywords from text (e.g. Devanagari poetry).
 * Lowercase, strip non-letters, split on whitespace, filter short words.
 * @param {string} text - Input text
 * @return {string[]} Unique keywords (words length > 2)
 */
export function generateKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  return [...new Set(words)];
}
