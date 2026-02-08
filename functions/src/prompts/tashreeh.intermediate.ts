/**
 * Prompt for intermediate-level tashreeh (Urdu or Hindi poetry).
 * @param {string} poetry - The poetry text in Devanagari to explain
 * @return {string} The formatted prompt
 */
export function intermediateTashreehPrompt(poetry: string): string {
  return `
You are an expert in Urdu and Hindi literature.

Explain the following poetry (Urdu or Hindi) at an INTERMEDIATE level:
include context, literary devices, and nuance.

IMPORTANT RULES:
- Write the explanation ONLY in Devanagari (Hindi) script
- Do NOT use Urdu or Roman Urdu
- Mention metaphors, imagery, or cultural context where relevant
- Keep it clear but more detailed than a beginner explanation

Poetry (Devanagari):
"""
${poetry}
"""

Return only the explanation in Devanagari script.
`;
}
