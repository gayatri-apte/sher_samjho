import {getGenAI} from "../services/gemini.service.js";

const EMBEDDING_MODEL = "gemini-embedding-001";

/**
 * Creates a dense embedding vector for the given text using Gemini.
 * @param {string} text - Input text to embed
 * @return {Promise<number[]>} Embedding vector
 */
export async function createEmbedding(text: string): Promise<number[]> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({model: EMBEDDING_MODEL});
  const result = await model.embedContent(text);
  return result.embedding.values;
}
