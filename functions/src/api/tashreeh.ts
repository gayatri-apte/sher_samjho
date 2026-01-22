import {Request, Response} from "express";
import {beginnerTashreehPrompt} from "../prompts/tashreeh.beginner";
import {generateText} from "../services/gemini.service";

/**
 * Handles tashreeh (explanation) requests for Urdu poetry.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export async function tashreehHandler(req: Request, res: Response) {
  try {
    const {text} = req.body;

    if (!text) {
      return res.status(400).json({error: "Text is required"});
    }

    const prompt = beginnerTashreehPrompt(text);
    const explanation = await generateText(prompt);

    return res.json({explanation});
  } catch (err) {
    console.error(err);
    return res.status(500).json({error: "Tashreeh failed"});
  }
}
