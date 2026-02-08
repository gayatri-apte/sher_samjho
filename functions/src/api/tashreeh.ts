import {Request, Response} from "express";
import {beginnerTashreehPrompt} from "../prompts/tashreeh.beginner";
import {intermediateTashreehPrompt} from "../prompts/tashreeh.intermediate";
import {scholarTashreehPrompt} from "../prompts/tashreeh.scholar";
import {generateText} from "../services/gemini.service";

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
 * Handles tashreeh (explanation) requests for Urdu poetry. Returns all levels.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export async function tashreehHandler(req: Request, res: Response) {
  try {
    const {text} = req.body;

    if (!text) {
      return res.status(400).json({error: "Text is required"});
    }

    const levels = await generateTashreehLevels(text);

    return res.json(levels);
  } catch (err: unknown) {
    const message = err instanceof Error ?
      err.message :
      "Unknown error";
    console.error("Tashreeh error:", err);
    let errorMsg: string;
    if (message.includes("GEMINI_API_KEY") || message.includes("API key")) {
      errorMsg = "Gemini API key not configured. Set google.gemini_key or " +
        "GEMINI_API_KEY.";
    } else if (message.startsWith("Gemini:")) {
      errorMsg = message;
    } else {
      errorMsg = `Tashreeh failed: ${message}`;
    }
    return res.status(500).json({error: errorMsg});
  }
}
