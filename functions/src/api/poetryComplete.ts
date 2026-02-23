import type {Request, Response} from "express";
import {getGenAI} from "../services/gemini.service";

/**
 * Completes an Urdu sher in classical style. Output is clearly labeled as
 * AI-generated; never attributed to a real poet.
 * @param {Request} req - Express request (body: line)
 * @param {Response} res - Express response
 */
export async function poetryComplete(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const {line} = req.body as { line?: string };

    if (
      !line ||
      typeof line !== "string" ||
      !line.trim()
    ) {
      res.status(400).json({error: "line is required"});
      return;
    }

    const genAI = getGenAI();
    const modelName =
      process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const model = genAI.getGenerativeModel({model: modelName});

    const prompt = `
Complete this Urdu sher in classical style:

${line.trim()}

Rules:
- Keep meter (beher) similar to the given line.
- Clearly label output as AI-generated.
- Do not attribute the completion to any real poet.
- Stay within culturally appropriate themes and imagery.
`;

    const result = await model.generateContent(prompt);
    const resp = result.response as unknown as {
      promptFeedback?: { blockReason?: string };
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      text: () => string;
    };

    if (resp.promptFeedback?.blockReason) {
      res.status(400).json({
        error: "Response was blocked. Try a different line.",
      });
      return;
    }

    const cand = resp.candidates?.[0];
    const completion =
      cand?.content?.parts?.length && typeof resp.text === "function" ?
        resp.text().trim() :
        "";

    res.json({
      completion: completion || "",
      label: "AI-Generated Completion",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("poetryComplete error:", err);
    if (message.includes("GEMINI_API_KEY not set")) {
      res.status(503).json({
        error: "AI service not configured. Set GEMINI_API_KEY in .env.",
      });
      return;
    }
    res.status(500).json({error: "AI failed"});
  }
}
