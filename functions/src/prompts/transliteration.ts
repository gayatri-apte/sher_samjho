/**
 * Prompt for transliterating Urdu (Perso-Arabic) to Devanagari (Hindi).
 * @param {string} urdu - Urdu text in Perso-Arabic script
 * @return {string} The formatted prompt
 */
export function urduToDevanagariPrompt(urdu: string): string {
  return `
You are an expert in Urdu and Hindi scripts.

Transliterate the following Urdu poetry (Perso-Arabic script)
into Devanagari (Hindi) script.
Preserve the exact meaning and pronunciation.
Output ONLY the Devanagari text, no explanation.

Urdu text:
"""
${urdu}
"""

Devanagari output:`;
}

/**
 * Prompt for transliterating Urdu to Roman (Roman Urdu / Latin script).
 * @param {string} urdu - Urdu text in Perso-Arabic script
 * @return {string} The formatted prompt
 */
export function urduToRomanPrompt(urdu: string): string {
  return `
You are an expert in Urdu and Roman Urdu.

Transliterate the following Urdu poetry (Perso-Arabic script)
into Roman Urdu (Latin script).
Use common Roman Urdu spelling. Preserve line breaks.
Output ONLY the Roman text, no explanation.

Urdu text:
"""
${urdu}
"""

Roman Urdu output:`;
}

/**
 * Prompt for transliterating Devanagari (Hindi) to Roman (Latin script).
 * @param {string} devanagari - Hindi text in Devanagari script
 * @return {string} The formatted prompt
 */
export function devanagariToRomanPrompt(devanagari: string): string {
  return `
You are an expert in Hindi and Roman transliteration.

Transliterate the following Hindi poetry (Devanagari script)
into Roman/Latin script (common Hindi romanization or IAST-style).
Preserve line breaks. Output ONLY the Roman text, no explanation.

Devanagari text:
"""
${devanagari}
"""

Roman output:`;
}
