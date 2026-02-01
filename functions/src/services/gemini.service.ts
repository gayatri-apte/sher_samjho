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
      type Config = {google?: {gemini_key?: string}};
      const getConfig = functions.config as () => Config;
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
  // Default is gemini-2.5-flash which supports generateContent and has high
  // token limits (up to 1M tokens).
  // Override via env var if needed, e.g. "gemini-1.5-pro",
  // "gemini-1.5-flash", "gemini-2.0-flash".
  let modelName: string | undefined;
  try {
    type Config = {google?: {gemini_model?: string}};
    const getConfig = functions.config as () => Config;
    const config = getConfig();
    modelName = config.google?.gemini_model;
  } catch {
    // functions.config() not available (e.g. local env without Firebase
    // runtime)
  }
  modelName = process.env.GEMINI_MODEL || modelName || "gemini-2.5-flash";
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
