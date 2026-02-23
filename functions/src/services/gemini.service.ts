import {GoogleGenerativeAI} from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

/**
 * Gets or initializes the Gemini AI client.
 * Uses GEMINI_API_KEY from environment (.env or .env.<projectId>).
 * @return {GoogleGenerativeAI} The initialized Gemini AI client
 */
export function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY not set. Add it to functions/.env and redeploy. " +
        "See firebase.google.com/docs/functions/config-env",
      );
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

const SAFETY_FINISH_REASONS = [
  "SAFETY",
  "RECITATION",
  "PROHIBITED_CONTENT",
  "BLOCKLIST",
  "LANGUAGE",
  "SPII",
];

/**
 * Generates text using Google's Gemini AI model.
 * Handles blocked/empty responses and surfaces clear errors.
 * @param {string} prompt - The prompt text to generate content from
 * @return {Promise<string>} The generated text response
 */
export async function generateText(prompt: string): Promise<string> {
  const client = getGenAI();

  // Model name must be valid for the API version used by
  // @google/generative-ai (v1beta).
  // Default is gemini-2.5-flash. Override via GEMINI_MODEL in .env if needed.
  const modelName =
    process.env.GEMINI_MODEL || "gemini-2.5-flash";
  console.log("Using Gemini model:", modelName);
  const model = client.getGenerativeModel({model: modelName});

  const result = await model.generateContent(prompt);
  const resp = result.response as unknown as {
    promptFeedback?: { blockReason?: string; blockReasonMessage?: string };
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
    }>;
    text: () => string;
  };

  if (resp.promptFeedback?.blockReason) {
    const msg =
      resp.promptFeedback.blockReasonMessage ||
      "Prompt was blocked by safety filters.";
    throw new Error(`Gemini: ${msg}`);
  }

  const cand = resp.candidates?.[0];
  if (!cand?.content?.parts?.length) {
    const fr = cand?.finishReason;
    const safety = fr && SAFETY_FINISH_REASONS.includes(fr);
    const reason = safety ? ` (finish reason: ${fr})` : "";
    throw new Error(
      "Gemini: Model returned no text" + reason + ". Try again."
    );
  }

  const text = resp.text().trim();
  if (!text) {
    throw new Error(
      "Gemini: Model returned empty text. Try again or use different poetry."
    );
  }

  return text;
}
