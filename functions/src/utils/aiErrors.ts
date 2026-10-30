import type {Response} from "express";
import {incrementStat} from "./updateAnalytics";

/**
 * Turns low-level Google/Gemini errors into a status + a message that tells
 * the user (or the developer at a demo) exactly what to fix.
 * @param {unknown} err - Thrown error
 * @param {string} feature - Feature name, e.g. "Scan"
 * @return {{status: number, message: string, code: string}} Friendly error
 */
export function describeError(
  err: unknown,
  feature: string,
): {status: number; message: string; code: string} {
  const raw = err instanceof Error ? err.message : String(err);
  const m = raw.toLowerCase();

  if (m.includes("gemini_api_key not set")) {
    return {status: 503, code: "AI_NOT_CONFIGURED",
      message: "AI isn't configured on the server (GEMINI_API_KEY missing)."};
  }
  if (m.includes("[401") || m.includes("unauthenticated") ||
      m.includes("api key not valid") || m.includes("api_key_invalid") ||
      m.includes("invalid api key") || (m.includes("[400") &&
      m.includes("api key"))) {
    return {status: 503, code: "AI_KEY_INVALID",
      message: "The Gemini API key on the server is invalid. Create a key " +
        "at aistudio.google.com/apikey, put it in functions/.env and " +
        "redeploy."};
  }
  if (m.includes("cloud vision api has not been used") ||
      m.includes("vision.googleapis.com") ||
      (m.includes("vision") && (m.includes("permission_denied") ||
        m.includes("permission denied") || m.includes("disabled")))) {
    return {status: 503, code: "VISION_DISABLED",
      message: "Cloud Vision API isn't enabled for this project. Enable it " +
        "in Google Cloud Console → APIs, wait 2 minutes, retry."};
  }
  if (m.includes("text-to-speech") || m.includes("texttospeech")) {
    return {status: 503, code: "TTS_DISABLED",
      message: "Cloud Text-to-Speech API isn't enabled for this project."};
  }
  if (m.includes("402") || m.includes("prepayment") ||
      m.includes("payment required")) {
    return {status: 503, code: "AI_BILLING",
      message: "The Gemini key's project has no credit left (402 Payment " +
        "Required). Add credits to its project at ai.studio/projects, or " +
        "create a key in a free-tier project."};
  }
  if (m.includes("resource_exhausted") || m.includes("quota") ||
      m.includes("[429") || m.includes("[503") || m.includes("high demand") ||
      m.includes("unavailable")) {
    if (m.includes("perday") || m.includes("per day") ||
        m.includes("requests_per_day") || m.includes("daily")) {
      return {status: 429, code: "AI_DAILY_QUOTA",
        message: "Today's Gemini quota for this API key is used up. It " +
          "resets at midnight Pacific time, or raise the limit / enable " +
          "billing for the key's project at aistudio.google.com."};
    }
    return {status: 429, code: "AI_QUOTA",
      message: "The AI is busy (per-minute limit reached). Wait about a " +
        "minute and try again."};
  }
  if (m.includes("billing")) {
    return {status: 503, code: "BILLING",
      message: "Billing isn't enabled for this Google Cloud project."};
  }
  if (m.includes("[404") && m.includes("model")) {
    return {status: 503, code: "AI_MODEL_UNAVAILABLE",
      message: "The configured Gemini model isn't available for this key. " +
        "Set GEMINI_MODEL in functions/.env to a current model " +
        "(e.g. gemini-3.8-flash) and redeploy."};
  }
  if (raw.startsWith("Gemini:")) {
    return {status: 502, code: "AI_EMPTY",
      message: raw.replace(/^Gemini: /, "")};
  }
  // Unknown: include a short, key-free reason so the cause is visible.
  const reason = raw.replace(/AIza[\w-]+|AQ\.[\w.-]+/g, "[key]")
    .replace(/\s+/g, " ").slice(0, 160);
  return {status: 500, code: "INTERNAL",
    message: `${feature} failed: ${reason || "unknown error"}`};
}

/**
 * Logs the full error and sends the friendly version.
 * @param {Response} res - Express response
 * @param {unknown} err - Error
 * @param {string} feature - Feature name
 */
export async function sendError(res: Response, err: unknown, feature: string) {
  const d = describeError(err, feature);
  console.error(`[${feature}] ${d.code}:`, err);
  if (d.code !== "INTERNAL") {
    await incrementStat("aiFailures").catch(() => undefined);
  }
  if (!res.headersSent) {
    res.status(d.status).json({error: d.message, code: d.code});
  }
}
