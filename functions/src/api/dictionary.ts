import {Request, Response} from "express";
import {generateText} from "../services/gemini.service";
import {dictionaryWordPrompt} from "../prompts/dictionary";
import {sendError} from "../utils/aiErrors";

/**
 * Explains a single word using AI (Urdu/Hindi poetry vocabulary).
 * @param {string} word - The word to explain
 * @return {Promise<string>} Short meaning in English
 */
export async function explainWord(word: string): Promise<string> {
  const prompt = dictionaryWordPrompt(word.trim());
  return generateText(prompt);
}

/**
 * Dictionary lookup handler. Returns AI-generated meaning for a word.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export async function dictionaryHandler(req: Request, res: Response) {
  try {
    const {word} = req.body as {word?: string};

    if (!word || typeof word !== "string" || !word.trim()) {
      return res.status(400).json({error: "word is required"});
    }

    const meaning = await explainWord(word);
    return res.json({meaning});
  } catch (err: unknown) {
    return sendError(res, err, "Dictionary");
  }
}
