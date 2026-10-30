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
  if (fallback && Date.now() < fallback.until) return fallback.model;
  return primaryModel();
}

/**
 * The configured primary model.
 * @return {string} Model name
 */
function primaryModel(): string {
  return process.env.GEMINI_MODEL || "gemini-3.8-flash";
}

// Quotas are per model. When the primary model's quota runs out we switch to
// another Flash model the key can use (GEMINI_FALLBACK_MODEL, or the best one
// found by listing the key's models) for 15 minutes, then try primary again.
let fallback: {model: string; until: number} | null = null;
let fallbackCandidates: string[] | null = null;

/**
 * Lists generateContent-capable Flash/Pro models available to this key,
 * best first, excluding the primary model.
 * @return {Promise<string[]>} Model names
 */
async function listFallbacks(): Promise<string[]> {
  if (fallbackCandidates) return fallbackCandidates;
  const env = (process.env.GEMINI_FALLBACK_MODEL || "").split(",")
    .map((m) => m.trim()).filter(Boolean);
  let listed: string[] = [];
  try {
    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models?pageSize=200",
      {
        headers: {"x-goog-api-key": process.env.GEMINI_API_KEY || ""},
        signal: AbortSignal.timeout(8000),
      },
    );
    const j = await r.json() as {models?: Array<{
      name: string; supportedGenerationMethods?: string[];
    }>};
    listed = (j.models || [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => m.name.replace(/^models\//, ""))
      .filter((n) => /flash|pro/.test(n) &&
        !/tts|image|live|audio|embed|robotic|computer|thinking-exp/.test(n));
  } catch (err) {
    console.warn("Could not list Gemini models:", err);
  }
  const score = (n: string) => {
    const v = Number((n.match(/(\d+(?:\.\d+)?)/) || ["0"])[0]);
    return v * 10 + (/flash/.test(n) && !/lite/.test(n) ? 3 :
      /lite/.test(n) ? 2 : 1) - (/preview|exp/.test(n) ? 0.5 : 0);
  };
  listed.sort((a, b) => score(b) - score(a));
  fallbackCandidates = [...new Set([...env, ...listed])]
    .filter((n) => n !== primaryModel());
  console.log("Gemini fallback candidates:", fallbackCandidates.join(", "));
  return fallbackCandidates;
}

/**
 * Switches to the next fallback model after a quota error.
 * @return {Promise<boolean>} true if a new model was selected
 */
async function switchModel(): Promise<boolean> {
  const list = await listFallbacks();
  const current = modelName();
  const idx = list.indexOf(current);
  const next = list[idx + 1];
  if (!next) return false;
  fallback = {model: next, until: Date.now() + 15 * 60_000};
  console.warn(`Gemini quota on ${current}; switching to ${next}`);
  return true;
}

const noThinking = new Set<string>();

/**
 * Generation config shared by every call. Gemini 3.x Flash thinks at
 * MEDIUM by default, which made answers take 25–70 s. LOW is plenty for
 * explanation / matching tasks and is several times faster.
 * Override with GEMINI_THINKING=low|medium|high|off in functions/.env.
 * @param {object} extra - Extra generationConfig fields
 * @return {object} generationConfig
 */
export function genConfig(
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  const level = (process.env.GEMINI_THINKING || "low").toLowerCase();
  if (noThinking.has(modelName()) || level === "off") return {...extra};
  return {...extra, thinkingConfig: {thinkingLevel: level}};
}

/**
 * Builds a model with our generation config (thinking level etc.).
 * @param {object} extra - Extra generationConfig fields
 * @return {GenerativeModel} Model
 */
export function getModel(extra: Record<string, unknown> = {}) {
  // Per-attempt timeout: a hung request becomes an error that withRetry
  // can retry or move to another model, instead of eating the 180 s limit.
  return getGenAI().getGenerativeModel({
    model: modelName(),
    generationConfig: genConfig(extra) as never,
  }, {timeout: Number(process.env.GEMINI_TIMEOUT_MS) || 40_000});
}

/**
 * Retries transient Gemini failures (503 high demand, 429 rate limit,
 * 500/504, network resets) with exponential backoff, so a momentary
 * overload during a demo doesn't surface as an error. If the model rejects
 * our thinkingConfig (400), thinking is switched off and the call retried.
 * @param {Function} fn - Call to attempt (must rebuild the model inside)
 * @param {number} attempts - Max attempts
 * @param {boolean} canSwitchModel - Allow switching generative model
 * @return {Promise<T>} Result of fn
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 5,
  canSwitchModel = true,
): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      const m = String(err instanceof Error ? err.message : err)
        .toLowerCase();
      const model = modelName();
      if (!noThinking.has(model) && m.includes("[400") &&
          m.includes("thinking")) {
        console.warn(`thinkingConfig rejected by ${model}; retrying without`);
        noThinking.add(model);
        continue;
      }
      // Quota used up (429 / RESOURCE_EXHAUSTED) or model not available to
      // this key (404): move to another model and retry straight away.
      const quota = /\[429|resource_exhausted|quota/.test(m);
      const missing = m.includes("[404") && m.includes("model");
      const timedOut = /abort|timed? ?out|timeout/.test(m);
      const switchable = quota || missing || timedOut;
      if (switchable && canSwitchModel && i < attempts - 1 &&
          await switchModel()) {
        continue;
      }
      const transient = new RegExp(
        "\\[(500|503|504)|unavailable|high demand|overloaded|" +
        "econnreset|etimedout|fetch failed",
      ).test(m);
      if (!transient || i === attempts - 1) throw err;
      const wait = 800 * 2 ** i + Math.floor(Math.random() * 400);
      console.warn(`Gemini transient error, retry ${i + 1} in ${wait}ms`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw last;
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
  const result = await withRetry(() => getModel().generateContent(prompt));
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
  const content = parts.map((p) => (typeof p === "string" ? {text: p} : p));
  const result = await withRetry(() => getModel({
    responseMimeType: "application/json",
    responseSchema: schema,
    temperature,
  }).generateContent(content));
  const text = readText(result.response as unknown as RawResponse);
  try {
    return JSON.parse(text) as T;
  } catch {
    // Occasionally models wrap JSON in fences; strip and retry once.
    const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "");
    return JSON.parse(cleaned) as T;
  }
}
