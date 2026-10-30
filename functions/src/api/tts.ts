import type {Request, Response} from "express";
import {generateSpeech} from "../utils/tts";
import {sendError} from "../utils/aiErrors";
import {LANGUAGES} from "../prompts/tashreeh.lang";

/**
 * Returns synthesized MP3 audio.
 * Body: { text: string, rate?: number }  (rate 0.5 = slow learner mode)
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function ttsHandler(req: Request, res: Response) {
  try {
    const text = String(req.body?.text ?? "").trim();
    if (!text) {
      res.status(400).json({error: "text is required"});
      return;
    }
    if (text.length > 1500) {
      res.status(400).json({error: "text too long (max 1500 chars)"});
      return;
    }
    const rate = Number(req.body?.rate) || 0.9;
    const lang = String(req.body?.lang || "");
    const audio = await generateSpeech(text, rate,
      LANGUAGES[lang]?.tts);

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Disposition": "inline; filename=sher.mp3",
      "Cache-Control": "public, max-age=86400",
    });
    res.send(audio);
  } catch (err) {
    await sendError(res, err, "Text-to-speech");
  }
}
