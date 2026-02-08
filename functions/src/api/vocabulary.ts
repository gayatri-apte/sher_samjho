import type {DecodedIdToken} from "firebase-admin/auth";
import type {Request, Response} from "express";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {updateStrength} from "../utils/sm2.js";

type AuthRequest = Request & {user?: DecodedIdToken};

export type VocabularyEntry = {
  id: string;
  word: string;
  meaning: string;
  strength: number;
  lastReviewed: FirebaseFirestore.Timestamp | null;
  addedAt: FirebaseFirestore.Timestamp;
};

/**
 * GET /vocabulary — list current user's vocabulary
 * @param {AuthRequest} req - Request (user attached by requireAuth)
 * @param {Response} res - Express response
 */
export async function getVocabularyHandler(req: AuthRequest, res: Response) {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({error: "Unauthorized"});
    }

    const db = getFirestore();
    const snap = await db
      .collection("users")
      .doc(uid)
      .collection("vocabulary")
      .orderBy("addedAt", "desc")
      .get();

    const words: VocabularyEntry[] = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        word: d.word ?? "",
        meaning: d.meaning ?? "",
        strength: typeof d.strength === "number" ? d.strength : 0,
        lastReviewed: d.lastReviewed ?? null,
        addedAt: d.addedAt,
      };
    });

    return res.json(words);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Get vocabulary error:", err);
    return res.status(500).json({
      error: `Failed to load vocabulary: ${message}`,
    });
  }
}

/**
 * POST /vocabulary — save a word to user's vocabulary
 * @param {AuthRequest} req - Request (user attached by requireAuth)
 * @param {Response} res - Express response
 */
export async function saveVocabularyHandler(req: AuthRequest, res: Response) {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({error: "Unauthorized"});
    }

    const {word, meaning} = req.body as {word?: string; meaning?: string};
    if (!word || typeof word !== "string" || !word.trim()) {
      return res.status(400).json({error: "word is required"});
    }

    const db = getFirestore();
    const meaningStr =
      meaning && typeof meaning === "string" ? meaning : "";
    await db
      .collection("users")
      .doc(uid)
      .collection("vocabulary")
      .add({
        word: word.trim(),
        meaning: meaningStr.trim(),
        strength: 0,
        lastReviewed: null,
        addedAt: FieldValue.serverTimestamp(),
      });

    return res.json({success: true});
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Save vocabulary error:", err);
    return res.status(500).json({error: `Save failed: ${message}`});
  }
}

/**
 * PATCH /vocabulary/:id/review — update strength using SM-2 (quality 0–5)
 * Body: { quality: number }
 * @param {AuthRequest} req - Request (user attached by requireAuth)
 * @param {Response} res - Express response
 */
export async function reviewVocabularyHandler(req: AuthRequest, res: Response) {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({error: "Unauthorized"});
    }

    const wordId = req.params.id as string;
    const {quality} = req.body as {quality?: number};
    if (wordId == null || wordId === "") {
      return res.status(400).json({
        error: "Vocabulary entry id is required",
      });
    }
    const q = typeof quality === "number" ? quality : undefined;
    if (q == null || q < 0 || q > 5) {
      return res.status(400).json({error: "quality must be a number 0–5"});
    }

    const db = getFirestore();
    const ref = db
      .collection("users")
      .doc(uid)
      .collection("vocabulary")
      .doc(wordId);
    const doc = await ref.get();
    if (!doc.exists) {
      return res.status(404).json({error: "Vocabulary entry not found"});
    }

    const data = doc.data();
    const oldStrength =
      typeof data?.strength === "number" ? data.strength : 0;
    const newStrength = updateStrength(oldStrength, q);

    await ref.update({
      strength: newStrength,
      lastReviewed: FieldValue.serverTimestamp(),
    });

    return res.json({success: true, strength: newStrength});
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Review vocabulary error:", err);
    return res.status(500).json({
      error: `Review failed: ${message}`,
    });
  }
}
