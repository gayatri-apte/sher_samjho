import {Request, Response} from "express";
import {generateSpeech} from "../utils/tts";

/**
 * HTTP handler that returns synthesized MP3 audio for provided text.
 * @param {Request} req - Express request with `text` in the body.
 * @param {Response} res - Express response used to send audio bytes.
 * @return {Promise<void>} Resolves when response is sent.
 */
export async function ttsHandler(req: Request, res: Response) {
  try {
    const {text} = req.body;

    const audio = await generateSpeech(text);

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Disposition": "inline; filename=sher.mp3",
    });

    res.send(audio);
  } catch (err) {
    console.error("TTS error:", err);
    res.status(500).json({error: "TTS failed"});
  }
}
