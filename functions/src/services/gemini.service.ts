import {GoogleGenerativeAI} from "@google/generative-ai";
import * as functions from "firebase-functions";

let genAI: GoogleGenerativeAI | null = null;

/**
 * Gets or initializes the Gemini AI client.
 * @return {GoogleGenerativeAI} The initialized Gemini AI client
 */
function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    // Try Firebase Functions config first (for deployed functions)
    // Then fall back to environment variable (for local development)
    let apiKey: string | undefined;
    try {
      // Access functions.config() with proper typing
      const getConfig = functions.config as () => {google?: {gemini_key?: string}};
      const config = getConfig();
      apiKey = config.google?.gemini_key;
    } catch {
      // functions.config() not available, use env var
    }
    apiKey = apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY not set. Configure via " +
        "firebase functions:config:set google.gemini_key=\"your-key\" " +
        "or set GEMINI_API_KEY environment variable",
      );
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

/**
 * Generates text using Google's Gemini AI model.
 * @param {string} prompt - The prompt text to generate content from
 * @return {Promise<string>} The generated text response
 */
export async function generateText(prompt: string): Promise<string> {
  const client = getGenAI();
  const model = client.getGenerativeModel({model: "gemini-1.5-flash"});
  const result = await model.generateContent(prompt);
  return result.response.text();
}
