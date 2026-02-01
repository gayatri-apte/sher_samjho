/**
 * Generates a prompt for beginner-level tashreeh (explanation) of Urdu poetry.
 * @param {string} poetry - The Urdu poetry text to explain
 * @return {string} The formatted prompt
 */
export function beginnerTashreehPrompt(poetry: string) {
  return `
You are an expert Urdu literature teacher.

Explain the meaning of the following Urdu poetry in SIMPLE words.

IMPORTANT RULES:
- Write the explanation ONLY in Devanagari (Hindi) script
- Do NOT use Urdu or Roman Urdu
- Do NOT translate word-by-word
- Explain the emotion and meaning clearly
- Keep it beginner-friendly

Urdu Poetry:
"""
${poetry}
"""

Return only the explanation in Devanagari script.
`;
}

