import {
  GoogleGenerativeAI,
  type Part,
  type ResponseSchema,
} from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

/**
 * Gets or initializes the Gemini AI client.
 * Uses GEMINI_API_KEY from environment (functions/.env — never commit it).
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

/**
 * Model used for all text + audio reasoning. Override with GEMINI_MODEL.
 * @return {string} Model name
 */
export function modelName(): string {
  return process.env.GEMINI_MODEL || "gemini-2.5-flash";
}

const SAFETY_FINISH_REASONS = [
  "SAFETY",
  "RECITATION",
  "PROHIBITED_CONTENT",
  "BLOCKLIST",
  "LANGUAGE",
  "SPII",
];

type RawResponse = {
  promptFeedback?: {blockReason?: string; blockReasonMessage?: string};
  candidates?: Array<{
    content?: {parts?: Array<{text?: string}>};
    finishReason?: string;
  }>;
  text: () => string;
};

/**
 * Validates a Gemini response and returns its text, throwing readable errors.
 * @param {RawResponse} resp - Raw SDK response
 * @return {string} Trimmed text
 */
function readText(resp: RawResponse): string {
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
    throw new Error("Gemini: Model returned no text" + reason + ". Try again.");
  }
  const text = resp.text().trim();
  if (!text) {
    throw new Error("Gemini: Model returned empty text. Try again.");
  }
  return text;
}

/**
 * Generates text using Gemini.
 * @param {string} prompt - The prompt text
 * @return {Promise<string>} The generated text response
 */
export async function generateText(prompt: string): Promise<string> {
  const model = getGenAI().getGenerativeModel({model: modelName()});
  const result = await model.generateContent(prompt);
  return readText(result.response as unknown as RawResponse);
}

/**
 * Builds an inline audio part from base64 audio.
 * @param {string} base64 - Base64-encoded audio (no data: prefix)
 * @param {string} mimeType - e.g. audio/wav
 * @return {Part} Gemini inline data part
 */
export function audioPart(base64: string, mimeType: string): Part {
  return {inlineData: {data: base64, mimeType}};
}

/**
 * Generates structured JSON from Gemini (text and/or audio parts).
 * Uses responseSchema so the output is always parseable.
 * @param {Array<string | Part>} parts - Prompt parts (text and/or audio)
 * @param {ResponseSchema} schema - Expected JSON schema
 * @param {number} temperature - Sampling temperature
 * @return {Promise<T>} Parsed JSON object
 */
export async function generateJSON<T>(
  parts: Array<string | Part>,
  schema: ResponseSchema,
  temperature = 0.2,
): Promise<T> {
  const model = getGenAI().getGenerativeModel({
    model: modelName(),
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature,
    },
  });
  const content = parts.map((p) => (typeof p === "string" ? {text: p} : p));
  const result = await model.generateContent(content);
  const text = readText(result.response as unknown as RawResponse);
  try {
    return JSON.parse(text) as T;
  } catch {
    // Occasionally models wrap JSON in fences; strip and retry once.
    const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "");
    return JSON.parse(cleaned) as T;
  }
}
