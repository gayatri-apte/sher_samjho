/**
 * Generates a prompt for beginner-level tashreeh (explanation) of Urdu poetry.
 * @param {string} poetry - The Urdu poetry text to explain
 * @return {string} The formatted prompt
 */
export function beginnerTashreehPrompt(poetry: string) {
  return `
  You are an expert Urdu literature teacher.
  
  Explain the following Urdu poetry in SIMPLE words.
  Do NOT translate word-by-word.
  Explain the meaning and emotion clearly.
  
  Poetry:
  """
  ${poetry}
  """
  
  Return only plain Urdu text.
  `;
}
