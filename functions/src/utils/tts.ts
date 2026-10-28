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
  if (/[؀-ۿ]/.test(text)) return "ur-IN";
  if (detectScript(text) === "devanagari" && /[ऀ-ॿ]/.test(text)) {
    return "hi-IN";
  }
  return "en-IN";
}

/**
 * Generates MP3 audio for poetry or a single word.
 * @param {string} text - Text to speak (max 1500 chars)
 * @param {number} rate - Speaking rate (0.5 slow learner mode … 1.1)
 * @return {Promise<Buffer>} MP3 bytes
 */
export async function generateSpeech(
  text: string,
  rate = 0.9,
): Promise<Buffer> {
  const clean = text.replace(/\s+\n/g, "\n").trim().slice(0, 1500);
  const speakingRate = Math.min(1.2, Math.max(0.5, rate));
  const lang = languageFor(clean);
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
    if (lang === "ur-IN") audio = await synth("hi-IN");
    else throw err;
  }

  cache.set(key, audio);
  if (cache.size > CACHE_MAX) {
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }
  return audio;
}
