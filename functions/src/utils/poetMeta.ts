const ERA: Record<string, string> = {
  "Mir Taqi Mir": "18th Century",
  "Khwaja Mir Dard": "18th Century",
  "Mirza Ghalib": "Mughal Era",
  "Sheikh Ibrahim Zauq": "Mughal Era",
  "Momin Khan Momin": "Mughal Era",
  "Bahadur Shah Zafar": "Mughal Era",
  "Daagh Dehlvi": "Mughal Era",
  "Allama Iqbal": "20th Century",
  "Faiz Ahmed Faiz": "Progressive",
  "Jaun Elia": "Modern",
  "Ahmad Faraz": "Modern",
};

/**
 * Derives the historical era label for a given poet.
 * Labels must match apps/web EraExplorerPage.
 * @param {string} poet - Name of the poet.
 * @return {string} Era, or "Unknown".
 */
export function getEraFromPoet(poet: string): string {
  return ERA[poet] ?? "Unknown";
}

/**
 * Derives the literary movement label for a given poet.
 * @param {string} poet - Name of the poet.
 * @return {string} Movement label.
 */
export function getMovementFromPoet(poet: string): string {
  if (poet === "Faiz Ahmed Faiz") return "Progressive Writers Movement";
  if (poet === "Allama Iqbal") return "Reformist";
  return "Classical";
}
