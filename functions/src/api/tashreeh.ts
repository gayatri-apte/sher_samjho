import {Request, Response} from "express";
import {beginnerTashreehPrompt} from "../prompts/tashreeh.beginner";
import {intermediateTashreehPrompt} from "../prompts/tashreeh.intermediate";
import {scholarTashreehPrompt} from "../prompts/tashreeh.scholar";
import {generateText} from "../services/gemini.service";
import {sendError} from "../utils/aiErrors";
import {getFirestore} from "firebase-admin/firestore";
import {LANGUAGES, langTashreehPrompt} from "../prompts/tashreeh.lang";

export type TashreehLevels = {
  beginner: string;
  intermediate: string;
  scholar: string;
};

/**
 * Generates tashreeh (explanation) for devanagari text. OCR uses beginner only.
 * @param {string} devanagariText - Text in Devanagari script
 * @return {Promise<string>} Explanation text (beginner level)
 */
export async function generateTashreeh(
  devanagariText: string
): Promise<string> {
  const prompt = beginnerTashreehPrompt(devanagariText);
  return generateText(prompt);
}

/**
 * Generates all three explanation levels for devanagari text.
 * @param {string} devanagariText - Text in Devanagari script
 * @return {Promise<TashreehLevels>} Object with beginner, intermediate, scholar
 */
export async function generateTashreehLevels(
  devanagariText: string
): Promise<TashreehLevels> {
  const [beginner, intermediate, scholar] = await Promise.all([
    generateText(beginnerTashreehPrompt(devanagariText)),
    generateText(intermediateTashreehPrompt(devanagariText)),
    generateText(scholarTashreehPrompt(devanagariText)),
  ]);
  return {beginner, intermediate, scholar};
}

/**
 * Handles tashreeh (explanation) requests for Urdu poetry.
 * If level is provided (beginner | intermediate | scholar), returns single
 * explanation with confidence. Otherwise returns all three levels.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export async function tashreehHandler(req: Request, res: Response) {
  try {
    const {text, level: rawLevel, lang: rawLang, textHash} = req.body as {
      text?: string; level?: string; lang?: string; textHash?: string;
    };

    if (!text) {
      return res.status(400).json({error: "Text is required"});
    }

    const confidence = 0.85;
    const aiGenerated = true;

    const prompts: Record<string, (t: string) => string> = {
      beginner: beginnerTashreehPrompt,
      intermediate: intermediateTashreehPrompt,
      scholar: scholarTashreehPrompt,
    };
    const lang = rawLang && LANGUAGES[rawLang] ? rawLang : "hi";
    const level = rawLevel && prompts[rawLevel] ? rawLevel :
      (lang !== "hi" ? "beginner" : "");

    if (level) {
      // Explanations are cached on the sher: Hindi in tashreeh.<level>,
      // other languages in tashreehLang.<lang>.<level>. A cached one is
      // returned without calling the AI at all.
      const field = lang === "hi" ?
        `tashreeh.${level}` : `tashreehLang.${lang}.${level}`;
      const hash = String(textHash || "");
      const ref = /^[a-f0-9]{64}$/.test(hash) ?
        getFirestore().collection("global_poetry_cache").doc(hash) : null;
      if (ref) {
        const snap = await ref.get().catch(() => null);
        const hit = snap?.exists ? snap.get(field) : null;
        if (typeof hit === "string" && hit.trim()) {
          return res.json({explanation: hit, lang, level, cached: true,
            confidence, aiGenerated});
        }
      }
      const prompt = lang === "hi" ?
        prompts[level](text) : langTashreehPrompt(text, level, lang);
      const explanation = await generateText(prompt);
      if (ref) await ref.update({[field]: explanation}).catch(() => undefined);
      return res.json({explanation, lang, level, confidence, aiGenerated});
    }

    const levels = await generateTashreehLevels(text);
    return res.json({...levels, confidence, aiGenerated});
  } catch (err: unknown) {
    return sendError(res, err, "Explanation");
  }
}
