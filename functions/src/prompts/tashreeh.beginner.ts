/**
 * Prompt for beginner-level tashreeh (Urdu or Hindi poetry).
 * @param {string} poetry - The poetry text in Devanagari to explain
 * @return {string} The formatted prompt
 */
export function beginnerTashreehPrompt(poetry: string) {
  return `
You are an expert in Urdu and Hindi literature.

Explain the meaning of the following poetry (Urdu or Hindi, in Devanagari)
in SIMPLE words.

IMPORTANT RULES:
- Write the explanation ONLY in Devanagari (Hindi) script
- Do NOT use Perso-Arabic script or Roman
- Do NOT translate word-by-word
- Explain the emotion and meaning clearly
- Keep it beginner-friendly

Poetry (Devanagari):
"""
${poetry}
"""

Return only the explanation in Devanagari script.
`;
}

