import type {DecodedIdToken} from "firebase-admin/auth";
import type {Request, Response} from "express";
import {getFirestore, Timestamp, FieldValue} from "firebase-admin/firestore";
import {createEmbedding} from "../utils/embedding.js";
import {generateKeywords} from "../utils/keywords.js";
import {updateStreak} from "../utils/streak.js";
import {extractPoet} from "../utils/metadata.js";
import {getEraFromPoet, getMovementFromPoet} from "../utils/poetMeta.js";
import {updateUserStats} from "../utils/updateUserStats";

/**
 * Detects high-level thematic tags from a poem's text.
 * Used to power mood/theme-based discovery (e.g. love, longing, rebellion).
 *
 * @param {string} text - Poem text in Devanagari/Urdu (normalized string)
 * @return {string[]} Array of theme identifiers
 */
function detectThemes(text: string): string[] {
  const lower = text.toLowerCase();
  const themes: string[] = [];

  if (lower.includes("ishq") || lower.includes("mohabbat")) {
    themes.push("love");
  }

  if (lower.includes("hijr") || lower.includes("judai")) {
    themes.push("longing");
  }

  if (lower.includes("inqilab") || lower.includes("azaadi")) {
    themes.push("rebellion");
  }

  if (themes.length === 0) {
    themes.push("general");
  }

  return themes;
}

type AuthRequest = Request & {user?: DecodedIdToken};

/**
 * Handles saving scan history
 * @param {AuthRequest} req - Request (user attached by requireAuth)
 * @param {Response} res - Express response
 */
export async function saveHandler(req: AuthRequest, res: Response) {
  try {
    const uid = req.user?.uid;

    if (!uid) {
      return res.status(401).json({error: "Unauthorized"});
    }

    const {
      cacheHash,
      hash,
      text,
      explanation,
      devanagariText,
      tashreeh,
      poet: incomingPoet,
      ocrConfidence,
      attributionConfidence,
    } =
      req.body as {
        cacheHash?: string;
        hash?: string;
        text?: string;
        explanation?: string;
        devanagariText?: string;
        tashreeh?: string;
        poet?: string;
        ocrConfidence?: number;
        attributionConfidence?: number;
      };

    const id = cacheHash || hash;

    if (!id || !text) {
      return res.status(400).json({
        error: "cacheHash (or hash) and text are required",
      });
    }

    const db = getFirestore();

    await db
      .collection("users")
      .doc(uid)
      .collection("scans")
      .doc(id) // doc ID = cacheHash/hash
      .set(
        {
          uid,
          cacheHash: id,
          text,
          explanation: explanation ?? tashreeh,
          devanagariText: devanagariText ?? text,
          tashreeh: tashreeh ?? explanation,
          ocrConfidence:
            typeof ocrConfidence === "number" ? ocrConfidence : undefined,
          attributionConfidence:
            typeof attributionConfidence === "number" ?
              attributionConfidence :
              undefined,
          createdAt: Timestamp.now(),
        },
        {merge: true}
      );

    const textForCache = devanagariText ?? text ?? "";
    if (textForCache) {
      const embedding = await createEmbedding(textForCache);
      const keywords = generateKeywords(textForCache);
      const poet = incomingPoet && incomingPoet.trim() !== "" ?
        incomingPoet :
        extractPoet(textForCache);
      const era = getEraFromPoet(poet);
      const source = "User Scan";
      const movement = getMovementFromPoet(poet);
      const themes = detectThemes(textForCache);
      await db
        .collection("global_poetry_cache")
        .doc(id)
        .set(
          {
            embedding,
            keywords,
            devanagariText: textForCache,
            tashreeh: tashreeh ?? explanation,
            poet,
            era,
            movement,
            source,
            themes,
            ocrConfidence:
              typeof ocrConfidence === "number" ? ocrConfidence : undefined,
            attributionConfidence:
              typeof attributionConfidence === "number" ?
                attributionConfidence :
                undefined,
            updatedAt: FieldValue.serverTimestamp(),
          },
          {merge: true}
        );
    }

    const userRef = db.collection("users").doc(uid);
    const snap = await userRef.get();
    const today = new Date().toISOString().slice(0, 10);
    const newStreak = updateStreak(snap.data() || {});

    await userRef.set(
      {
        streak: newStreak,
        lastActiveDate: today,
      },
      {merge: true}
    );

    await updateUserStats(uid, "totalScans");

    return res.json({success: true});
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error";
    const code =
      typeof err === "object" && err !== null && "code" in err ?
        (err as {code: unknown}).code :
        undefined;

    console.error("Save error:", err);

    if (code === 5 || message.includes("NOT_FOUND")) {
      return res.status(503).json({
        error:
          "Firestore database not found. Create a Firestore database " +
          "in Firebase Console (Build > Firestore Database > Create database).",
        detail: message,
      });
    }

    return res.status(500).json({error: `Save failed: ${message}`});
  }
}
