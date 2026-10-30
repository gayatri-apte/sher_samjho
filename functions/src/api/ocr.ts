import {Request, Response} from "express";
import * as admin from "firebase-admin";
import {extractTextFromImage} from "../services/vision.service";
import {createHash} from "../utils/hash";
import {detectScript} from "../utils/scriptDetection";
import {
  transliterateDevanagariToRoman,
  transliterateToDevanagari,
  transliterateToRoman,
} from "../utils/transliterate";
import {generateTashreehLevels} from "./tashreeh";
import {beginnerTashreehPrompt} from "../prompts/tashreeh.beginner";
import {generateText} from "../services/gemini.service";
import {incrementStat} from "../utils/updateAnalytics";
import {sendError} from "../utils/aiErrors";

type CachedOCRData = {
  tashreeh?: string | import("./tashreeh").TashreehLevels;
  devanagariText?: string;
  rawUrdu?: string;
  confidence?: number;
  aiGenerated?: boolean;
  // Allow additional cached fields without strict typing
  [key: string]: unknown;
};

/**
 * Normalizes whitespace for display.
 * @param {string} text - Raw text
 * @return {string} Single-space trimmed text
 */
function normalizeForDisplay(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * HTTP endpoint for OCR using Google Vision API with global poetry cache.
 * On cache hit: returns cached result and increments hitCount.
 * On cache miss: OCR → transliterate → tashreeh → cache → return.
 *
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @return {Promise<void>}
 */
export async function ocrHandler(req: Request, res: Response): Promise<void> {
  try {
    if (!req.body?.image) {
      res.status(400).json({error: "Image missing"});
      return;
    }

    const image = String(req.body.image).replace(/^data:[^,]+,/, "");
    const buffer = Buffer.from(image, "base64");
    if (buffer.length > 8 * 1024 * 1024) {
      res.status(413).json({error: "Image too large (max 8 MB)."});
      return;
    }
    const rawText = (await extractTextFromImage(buffer)).trim();

    // No text detected: do NOT cache an empty "sher" under hash("").
    if (rawText.replace(/[\s\p{P}\d]/gu, "").length < 3) {
      res.status(422).json({
        error: "No poetry text found in this image. Try a clearer, " +
          "well-lit photo of the printed sher.",
      });
      return;
    }

    const textHash = createHash(rawText);

    const cacheRef = admin
      .firestore()
      .collection("global_poetry_cache")
      .doc(textHash);

    const cached = await cacheRef.get();

    if (cached.exists) {
      await cacheRef.update({
        hitCount: admin.firestore.FieldValue.increment(1),
      });
      const cachedData = cached.data() as CachedOCRData;

      // If this is an older cached entry that only has a single
      // tashreeh string, upgrade it in-place to the multi-level
      // structure so the Scan page selector shows real levels.
      let upgradedData = cachedData;
      if (cachedData && typeof cachedData.tashreeh === "string") {
        const hasDevanagari =
          typeof cachedData.devanagariText === "string" &&
          cachedData.devanagariText.trim() !== "";

        let sourceText: string;
        if (hasDevanagari) {
          sourceText = cachedData.devanagariText as string;
        } else {
          sourceText = String(cachedData.rawUrdu ?? "");
        }

        const levels = await generateTashreehLevels(sourceText);
        await cacheRef.update({tashreeh: levels});
        upgradedData = {...cachedData, tashreeh: levels};
      }
      await incrementStat("totalScans");
      // never send the 3k-float embedding / keyword arrays to the browser
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {embedding, keywords, ...publicData} = upgradedData;
      res.json({
        ...publicData,
        textHash,
        confidence: upgradedData?.confidence ?? 0.85,
        aiGenerated: upgradedData?.aiGenerated ?? true,
      });
      return;
    }

    // CACHE MISS: detect script and process Urdu or Hindi
    const script = detectScript(rawText);
    let devanagariText: string;
    let romanText: string;
    let beginner: string;

    // Only the beginner tashreeh is written now; intermediate and scholar
    // are generated when the user opens them (POST /tashreeh with level).
    // Fewer, parallel Gemini calls keep a first scan well under a minute
    // and inside the per-minute quota.
    if (script === "devanagari") {
      devanagariText = normalizeForDisplay(rawText);
      [romanText, beginner] = await Promise.all([
        transliterateDevanagariToRoman(devanagariText),
        generateText(beginnerTashreehPrompt(devanagariText)),
      ]);
    } else {
      [devanagariText, romanText] = await Promise.all([
        transliterateToDevanagari(rawText),
        transliterateToRoman(rawText),
      ]);
      beginner = await generateText(beginnerTashreehPrompt(devanagariText));
    }
    const tashreeh = {beginner, intermediate: "", scholar: ""};

    const result = {
      rawUrdu: rawText,
      script,
      devanagariText,
      tashreeh,
      romanText,
      textHash,
      hitCount: 1,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      confidence: 0.85,
      aiGenerated: true,
    };

    await cacheRef.set(result);

    await incrementStat("totalScans");
    res.json(result);
    return;
  } catch (error) {
    await sendError(res, error, "Scan");
  }
}
