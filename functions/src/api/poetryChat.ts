import type {Request, Response} from "express";
import * as admin from "firebase-admin";
import {getGenAI} from "../services/gemini.service";
import {incrementStat} from "../utils/updateAnalytics";

const SAFETY_FINISH_REASONS = [
  "SAFETY",
  "RECITATION",
  "PROHIBITED_CONTENT",
  "BLOCKLIST",
  "LANGUAGE",
  "SPII",
];

/**
 * Conversational poetry AI: context-aware Q&A about a specific sher.
 * Knows the sher, poet, explanation level; respects guardrails; labels AI.
 * For scholar level: detects intertextual / stylistic resemblance to
 * classical poets (e.g. Ghalib, Mir, Faiz) without claiming authorship.
 * @param {Request} req - Express request (body: textHash, question, level)
 * @param {Response} res - Express response
 */
export async function poetryChat(req: Request, res: Response): Promise<void> {
  try {
    const {textHash, question, level} = req.body as {
      textHash?: string;
      question?: string;
      level?: string;
    };
    console.log("poetryChat request", {
      textHash: textHash?.slice(0, 12),
      hasQuestion: !!question,
      level,
    });

    if (!textHash || !question) {
      res.status(400).json({error: "textHash and question are required"});
      return;
    }

    const db = admin.firestore();
    const cacheRef = db.collection("global_poetry_cache").doc(textHash);
    const snap = await cacheRef.get();

    if (!snap.exists) {
      res.status(404).json({error: "Poetry not found"});
      return;
    }

    const data = snap.data();
    const rawUrdu = data?.rawUrdu ?? data?.devanagariText ?? "";
    const poet = data?.poet ?? "Unknown";
    const effectiveLevel =
      level === "scholar" ||
      level === "intermediate" ||
      level === "beginner" ?
        level :
        "beginner";

    const levelInstruction: Record<string, string> = {
      beginner: "Explain in very simple Hindi/Urdu.",
      intermediate: "Explain with literary depth.",
      scholar:
        "Provide deep classical literary analysis " +
        "including meter and context.",
    };

    const genAI = getGenAI();
    const modelName =
      process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const model = genAI.getGenerativeModel({model: modelName});

    const intertextualInstruction =
      effectiveLevel === "scholar" ?
        [
          "",
          "Also consider intertextual reference detection: if themes, imagery,",
          "or style resemble classical Urdu poets (e.g. Ghalib, Mir, Faiz,",
          "Iqbal), you may mention stylistic or thematic resemblance.",
          "Do NOT claim authorship or that the sher is by that poet—only note",
          "that it echoes or recalls their tradition.",
        ].join("\n") :
        "";

    const prompt = `
You are a literary Urdu poetry scholar.

${levelInstruction[effectiveLevel]}

Sher:
${rawUrdu}

Poet: ${poet}

User level: ${effectiveLevel}

User question:
${question}

Rules:
- Be culturally accurate.
- If interpretation is uncertain, say so.
- Mention that AI interpretations may vary.
- Do NOT fabricate sources or attributions.
- Keep the tone and depth appropriate to the user's level.
- Also mention if this sher references:
  - Another poet
  - A Quranic phrase
  - A classical metaphor
  - A historical event
${intertextualInstruction}
`;

    const result = await model.generateContent(prompt);
    const resp = result.response as unknown as {
      promptFeedback?: { blockReason?: string; blockReasonMessage?: string };
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
        finishReason?: string;
      }>;
      text: () => string;
    };

    if (resp.promptFeedback?.blockReason) {
      const msg =
        resp.promptFeedback.blockReasonMessage ||
        "Prompt was blocked by safety filters.";
      console.warn("poetryChat Gemini block:", msg);
      await incrementStat("aiFailures");
      res.status(400).json({
        error: "Response was blocked. Try rephrasing your question.",
      });
      return;
    }

    const cand = resp.candidates?.[0];
    if (!cand?.content?.parts?.length) {
      const fr = cand?.finishReason;
      const safety = fr && SAFETY_FINISH_REASONS.includes(fr);
      const reason = safety ? ` (${fr})` : " (no content)";
      console.warn("poetryChat Gemini no text:", reason);
      await incrementStat("aiFailures");
      res.status(502).json({
        error: "Model returned no text. Try again or rephrase.",
      });
      return;
    }

    const answer =
      typeof resp.text === "function" ? resp.text().trim() : "";

    await incrementStat("totalAIQueries");

    res.json({
      answer: answer || "I couldn't generate a response. Please try again.",
      aiGenerated: true,
      disclaimer:
        "AI-generated literary interpretation. Multiple interpretations may " +
        "exist.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("poetryChat error:", err);

    await incrementStat("aiFailures");

    if (message.includes("GEMINI_API_KEY not set")) {
      res.status(503).json({
        error:
          "AI service not configured. Set GEMINI_API_KEY in functions/.env.",
      });
      return;
    }
    if (message.includes("Gemini:")) {
      res.status(502).json({error: message.replace(/^Gemini: /, "")});
      return;
    }

    res.status(500).json({
      error: "AI failed",
      detail: process.env.NODE_ENV === "development" ? message : undefined,
    });
  }
}
