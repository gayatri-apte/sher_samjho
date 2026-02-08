import type {DecodedIdToken} from "firebase-admin/auth";
import type {Request, Response} from "express";
import {getFirestore, FieldValue} from "firebase-admin/firestore";

type AuthRequest = Request & {user?: DecodedIdToken};

/**
 * PUT /word/review — update strength and lastReviewed for a word
 * Body: { wordId: string, rating: number } — rating 0–5
 * @param {AuthRequest} req - Request (user attached by requireAuth)
 * @param {Response} res - Express response
 */
export async function wordReviewHandler(req: AuthRequest, res: Response) {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({error: "Unauthorized"});
    }

    const {wordId, rating} = req.body as {wordId?: string; rating?: number};
    if (!wordId || typeof wordId !== "string" || !wordId.trim()) {
      return res.status(400).json({error: "wordId is required"});
    }
    const r = typeof rating === "number" ? rating : undefined;
    if (r == null || r < 0 || r > 5) {
      return res.status(400).json({error: "rating must be a number 0–5"});
    }

    const db = getFirestore();
    const ref = db
      .collection("users")
      .doc(uid)
      .collection("words")
      .doc(wordId.trim());
    const doc = await ref.get();
    if (!doc.exists) {
      return res.status(404).json({error: "Word not found"});
    }

    await ref.update({
      strength: r,
      lastReviewed: FieldValue.serverTimestamp(),
    });

    return res.json({success: true, strength: r});
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Word review error:", err);
    return res.status(500).json({
      error: `Review failed: ${message}`,
    });
  }
}
