/**
 * Extracts the poet name from the given Devanagari text
 * using simple string checks.
 *
 * @param {string} text - The Devanagari text to inspect.
 * @return {string} The detected poet name or "Unknown".
 */
export function extractPoet(text: string): string {
  if (text.includes("ग़ालिब")) {
    return "Mirza Ghalib";
  }
  if (text.includes("फ़ैज़")) {
    return "Faiz Ahmed Faiz";
  }
  if (text.includes("मीर")) {
    return "Mir Taqi Mir";
  }
  return "Unknown";
}

/**
 * Returns the historical era associated with a given poet.
 *
 * @param {string} poet - The poet's canonical name.
 * @return {string} The associated historical era label.
 */
export function guessEra(poet: string): string {
  switch (poet) {
  case "Mirza Ghalib":
    return "Mughal Era";
  case "Mir Taqi Mir":
    return "18th Century";
  case "Faiz Ahmed Faiz":
    return "Progressive Movement";
  default:
    return "Unknown";
  }
}

/**
 * Returns the literary movement for a given poet.
 *
 * @param {string} poet - The poet's canonical name.
 * @return {string} The associated literary movement label.
 */
export function guessMovement(poet: string): string {
  switch (poet) {
  case "Faiz Ahmed Faiz":
    return "Progressive Writers Movement";
  default:
    return "Classical";
  }
}

