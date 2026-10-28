import type {Request, Response} from "express";
import {getFirestore} from "firebase-admin/firestore";
import {nearest} from "../utils/corpus";

/**
 * Finds shers similar in meaning to a given one (by embedding).
 * Body: { textHash: string }
 * @param {Request} req - Request with body.textHash
 * @param {Response} res - Express response
 */
export async function similarSher(req: Request, res: Response): Promise<void> {
  try {
    const textHash = String(req.body?.textHash ?? "");
    if (!textHash) {
      res.status(400).json({error: "textHash required"});
      return;
    }
    const doc = await getFirestore()
      .collection("global_poetry_cache")
      .doc(textHash)
      .get();
    const emb = doc.data()?.embedding as number[] | undefined;
    if (!doc.exists || !emb) {
      // Not saved yet (no embedding): return empty instead of an error
      res.json([]);
      return;
    }
    res.json(await nearest(emb, 5, textHash, 0.5));
  } catch (err) {
    console.error("similarSher error:", err);
    res.status(500).json({error: "Similar search failed"});
  }
}
