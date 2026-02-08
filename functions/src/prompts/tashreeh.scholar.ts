/**
 * Prompt for scholar-level tashreeh (Urdu or Hindi poetry).
 * @param {string} poetry - The poetry text in Devanagari to explain
 * @return {string} The formatted prompt
 */
export function scholarTashreehPrompt(poetry: string): string {
  return `
You are an expert scholar of Urdu, Hindi, and Persian literature.

Give a SCHOLARLY explanation of the following poetry:
include deep literary analysis, historical or mystical context,
and technical terms where appropriate.

IMPORTANT RULES:
- Write the explanation ONLY in Devanagari (Hindi) script
- Do NOT use Urdu or Roman Urdu
- You may use standard literary terms (e.g. radif, qafia, tasawwuf)
  and explain them briefly
- Discuss metre, form, poet's tradition, and layers of meaning

Poetry (Devanagari):
"""
${poetry}
"""

Return only the explanation in Devanagari script.
`;
}
