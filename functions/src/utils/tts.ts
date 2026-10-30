import {TextToSpeechClient} from "@google-cloud/text-to-speech";
import {detectScript} from "./scriptDetection";

let client: TextToSpeechClient | null = null;

/**
 * Lazily creates the TTS client (so module import never fails at deploy).
 * @return {TextToSpeechClient} Client
 */
function getClient(): TextToSpeechClient {
  if (!client) client = new TextToSpeechClient();
  return client;
}

// Small LRU so the same sher/word is not re-synthesised on every tap.
const cache = new Map<string, Buffer>();
const CACHE_MAX = 200;

/**
 * Picks a voice language from the script of the text.
 * Perso-Arabic → Urdu (ur-IN); Devanagari → Hindi (hi-IN);
 * Roman → Indian English accent reads Roman Urdu acceptably.
 * @param {string} text - Input text
 * @return {string} BCP-47 language code
 */
function languageFor(text: string): string {
  if (/[\u0600-\u06FF]/.test(text)) return "ur-IN";
  const scripts: Array<[RegExp, string]> = [
    [/[\u0C00-\u0C7F]/, "te-IN"], [/[\u0B80-\u0BFF]/, "ta-IN"],
    [/[\u0980-\u09FF]/, "bn-IN"], [/[\u0A80-\u0AFF]/, "gu-IN"],
    [/[\u0C80-\u0CFF]/, "kn-IN"], [/[\u0D00-\u0D7F]/, "ml-IN"],
    [/[\u0A00-\u0A7F]/, "pa-IN"],
  ];
  for (const [re, code] of scripts) if (re.test(text)) return code;
  if (detectScript(text) === "devanagari" && /[\u0900-\u097F]/.test(text)) {
    return "hi-IN";
  }
  return "en-IN";
}

/**
 * Generates MP3 audio for poetry or a single word.
 * @param {string} text - Text to speak (max 1500 chars)
 * @param {number} rate - Speaking rate (0.5 slow learner mode … 1.1)
 * @param {string} languageCode - Optional voice language, e.g. mr-IN
 * @return {Promise<Buffer>} MP3 bytes
 */
export async function generateSpeech(
  text: string,
  rate = 0.9,
  languageCode?: string,
): Promise<Buffer> {
  const clean = text.replace(/\s+\n/g, "\n").trim().slice(0, 1500);
  const speakingRate = Math.min(1.2, Math.max(0.5, rate));
  // Marathi shares Devanagari with Hindi, so the caller may name the voice.
  const lang = languageCode && /^[a-z]{2}-IN$/.test(languageCode) ?
    languageCode : languageFor(clean);
  const key = `${lang}|${speakingRate}|${clean}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const synth = async (languageCode: string) => {
    const [response] = await getClient().synthesizeSpeech({
      // Line breaks become short pauses, like a mushaira reading.
      input: {text: clean.replace(/\n+/g, " ... ")},
      voice: {languageCode, ssmlGender: "MALE" as const},
      audioConfig: {audioEncoding: "MP3" as const, speakingRate},
    });
    return Buffer.from(response.audioContent as Uint8Array);
  };

  let audio: Buffer;
  try {
    audio = await synth(lang);
  } catch (err) {
    // Urdu voice not enabled in this project/region → fall back to Hindi.
    // Voice not available for this language → closest fallback.
    if (lang === "ur-IN" || lang === "mr-IN") audio = await synth("hi-IN");
    else if (lang !== "en-IN") audio = await synth("en-IN");
    else throw err;
  }

  cache.set(key, audio);
  if (cache.size > CACHE_MAX) {
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }
  return audio;
}
