/**
 * Derives the historical era label for a given poet.
 *
 * @param {string} poet - Name of the poet.
 * @return {string} Era associated with the poet, or
 * "Unknown" if not mapped.
 */
export function getEraFromPoet(poet: string): string {
  switch (poet) {
  case "Mirza Ghalib":
    return "Mughal Era";
  case "Mir Taqi Mir":
    return "18th Century";
  case "Faiz Ahmed Faiz":
    return "Progressive";
  default:
    return "Unknown";
  }
}

/**
 * Derives the literary movement label for a given poet.
 *
 * @param {string} poet - Name of the poet.
 * @return {string} Movement associated with the poet, or
 * a default value if not mapped.
 */
export function getMovementFromPoet(poet: string): string {
  switch (poet) {
  case "Faiz Ahmed Faiz":
    return "Progressive Writers Movement";
  default:
    return "Classical";
  }
}

