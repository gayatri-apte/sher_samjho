/**
 * Prompt for explaining a single word (Urdu/Hindi poetry vocabulary).
 * @param {string} word - The word to explain (Devanagari or Roman)
 * @return {string} The formatted prompt
 */
export function dictionaryWordPrompt(word: string): string {
  return `
You are an expert in Urdu and Hindi poetry and vocabulary.

Explain the meaning of this single word in 1–2 short sentences.
The word may be in Devanagari script or in Roman (transliteration).

Word: "${word}"

RULES:
- Reply in simple English.
- If the word is in Devanagari/Urdu, give the meaning and optionally
  a one-word English equivalent.
- Be concise; this is for a tap-to-learn dictionary popup.

Return only the explanation, no preamble.
`;
}
