export function normalizeUrdu(text: string): string {
    return text
      .replace(/\u200c|\u200d/g, "") // remove zero-width chars
      .replace(/\s+/g, " ")
      .replace(/ ۔/g, "۔")
      .replace(/ ،/g, "،")
      .trim();
  }
  