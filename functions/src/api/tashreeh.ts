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
