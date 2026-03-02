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
import {incrementStat} from "../utils/updateAnalytics";

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

    const buffer = Buffer.from(req.body.image, "base64");
    const rawText = await extractTextFromImage(buffer);

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
      res.json({
        ...upgradedData,
        confidence: upgradedData?.confidence ?? 0.85,
        aiGenerated: upgradedData?.aiGenerated ?? true,
      });
      return;
    }

    // CACHE MISS: detect script and process Urdu or Hindi
    const script = detectScript(rawText);
    let devanagariText: string;
    let romanText: string;

    if (script === "devanagari") {
      // Hindi: text is already Devanagari
      devanagariText = normalizeForDisplay(rawText);
      romanText = await transliterateDevanagariToRoman(devanagariText);
    } else {
      // Urdu: transliterate to Devanagari and Roman
      devanagariText = await transliterateToDevanagari(rawText);
      romanText = await transliterateToRoman(rawText);
    }

    const tashreeh = await generateTashreehLevels(devanagariText);

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
    console.error("OCR error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    const errorDetails = error instanceof Error ? error.stack : String(error);
    console.error("OCR error details:", errorDetails);
    res.status(500).json({
      error: "OCR failed",
      message: errorMessage,
      details: process.env.NODE_ENV === "development" ?
        errorDetails : undefined,
    });
  }
}
