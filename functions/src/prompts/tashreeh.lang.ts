/**
 * Explanation languages. "hi" is the original (Devanagari Hindi) prompts;
 * every other language uses langTashreehPrompt below.
 * tts = Google Cloud Text-to-Speech language code for reading it aloud.
 */
export const LANGUAGES: Record<string, {
  name: string; script: string; tts: string;
}> = {
  hi: {name: "Hindi", script: "Devanagari", tts: "hi-IN"},
  en: {name: "English", script: "Latin", tts: "en-IN"},
  mr: {name: "Marathi", script: "Devanagari", tts: "mr-IN"},
  gu: {name: "Gujarati", script: "Gujarati", tts: "gu-IN"},
  pa: {name: "Punjabi", script: "Gurmukhi", tts: "pa-IN"},
  bn: {name: "Bengali", script: "Bengali", tts: "bn-IN"},
  te: {name: "Telugu", script: "Telugu", tts: "te-IN"},
  ta: {name: "Tamil", script: "Tamil", tts: "ta-IN"},
  kn: {name: "Kannada", script: "Kannada", tts: "kn-IN"},
  ml: {name: "Malayalam", script: "Malayalam", tts: "ml-IN"},
  ur: {name: "Urdu", script: "Perso-Arabic (Nastaliq)", tts: "ur-IN"},
};

const DEPTH: Record<string, string> = {
  beginner: "in SIMPLE, everyday words for someone new to Urdu poetry. " +
    "Explain the feeling and the meaning; 4–6 sentences.",
  intermediate: "for a reader who knows some shayari: the meaning, the key " +
    "Urdu words and images, and the emotion; 6–10 sentences.",
  scholar: "in depth: meaning, wordplay and double meanings, imagery, " +
    "the poet's style and the tradition it belongs to; 10–15 sentences.",
};

/**
 * Builds a tashreeh prompt for any supported language and level.
 * @param {string} poetry - Sher in Devanagari
 * @param {string} level - beginner | intermediate | scholar
 * @param {string} lang - Language code from LANGUAGES
 * @return {string} Prompt
 */
export function langTashreehPrompt(
  poetry: string, level: string, lang: string,
): string {
  const L = LANGUAGES[lang] ?? LANGUAGES.en;
  return `You are an expert in Urdu poetry and a warm teacher.

Explain the following Urdu sher ${DEPTH[level] ?? DEPTH.beginner}

RULES:
- Write the WHOLE explanation in ${L.name}, in ${L.script} script.
- When you mention an Urdu word, write it in ${L.script} script and give its
  meaning in ${L.name}.
- Do not translate word by word; explain what the poet means and feels.
- This is an interpretation; if a line can be read in more than one way,
  say so briefly.
- Plain text only, no markdown headings.

Sher (Devanagari):
"""
${poetry}
"""`;
}
