import type {DecodedIdToken} from "firebase-admin/auth";
import type {Request, Response} from "express";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {createHash} from "../utils/hash";

type AuthRequest = Request & {user?: DecodedIdToken};

/**
 * POST /word/save — save a word to user's words collection
 * Body: { word: string, meaning: string }
 * Schema: users/{uid}/words/{wordId}
 * @param {AuthRequest} req - Request (user attached by requireAuth)
 * @param {Response} res - Express response
 */
export async function saveWordHandler(req: AuthRequest, res: Response) {
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
    const wordId = createHash(word.trim()).slice(0, 32);

    await db
      .collection("users")
      .doc(uid)
      .collection("words")
      .doc(wordId)
      .set({
        word: word.trim(),
        meaning: meaningStr.trim(),
        strength: 0,
        createdAt: FieldValue.serverTimestamp(),
        lastReviewed: null,
      });

    return res.json({success: true, id: wordId});
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Save word error:", err);
    return res.status(500).json({
      error: `Save word failed: ${message}`,
    });
  }
}
