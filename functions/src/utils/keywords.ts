/**
 * Folds Roman text to plain ASCII-ish form so "hazaron" matches "hazāroñ".
 * Devanagari/Urdu words are kept intact (their vowel signs are \p{M}).
 * @param {string} w - A word
 * @return {string} Folded word
 */
function fold(w: string): string {
  if (/[ऀ-ॿ؀-ۿ]/.test(w)) return w.normalize("NFC");
  return w.normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[.'’]/g, "").toLowerCase();
}

/**
 * Generates searchable keywords from poetry text (any script).
 * Previously used [^\p{L}] which deleted Devanagari vowel signs
 * (matras are \p{M}), so Hindi keyword search never matched.
 * @param {string} text - Input text
 * @return {string[]} Unique keywords (length > 2)
 */
export function generateKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\s'’.-]/gu, " ")
    .split(/[\s-]+/)
    .map(fold)
    .filter((w) => w.length > 2);
  return [...new Set(words)];
}
