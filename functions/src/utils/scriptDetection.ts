/**
 * Detects if text is predominantly Devanagari (Hindi) or Perso-Arabic (Urdu).
 * @param {string} text - Raw OCR text
 * @return {'devanagari' | 'urdu'} Dominant script
 */
export function detectScript(text: string): "devanagari" | "urdu" {
  let devanagariCount = 0;
  let arabicCount = 0;

  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    // Devanagari (U+0900–U+097F) and extensions
    const isDevanagari =
      (code >= 0x0900 && code <= 0x097f) ||
      (code >= 0x1cd0 && code <= 0x1cff);
    if (isDevanagari) {
      devanagariCount++;
    }
    // Arabic block (U+0600–U+06FF) - covers Urdu Perso-Arabic
    if (code >= 0x0600 && code <= 0x06ff) {
      arabicCount++;
    }
  }

  return devanagariCount >= arabicCount ? "devanagari" : "urdu";
}
