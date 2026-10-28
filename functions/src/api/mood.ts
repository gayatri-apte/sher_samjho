import type {Request, Response} from "express";
import {getFirestore} from "firebase-admin/firestore";
import {createEmbedding} from "../utils/embedding.js";
import {nearest} from "../utils/corpus";
import {toPublicSher} from "../utils/vectors";

/**
 * Mood-based discovery: tagged moods/themes first, then embedding search.
 * @param {Request} req - Request with body.mood
 * @param {Response} res - Express response
 */
export async function moodSearch(req: Request, res: Response) {
  try {
    const mood = String(req.body?.mood ?? "").trim().toLowerCase();
    if (!mood) return res.status(400).json({error: "Mood required"});

    const col = getFirestore().collection("global_poetry_cache");
    for (const q of [
      col.where("mood", "==", mood),
      col.where("moods", "array-contains", mood),
      col.where("themes", "array-contains", mood),
    ]) {
      const snap = await q.limit(20).get();
      if (!snap.empty) {
        return res.json(snap.docs.map((d) => toPublicSher(d.id, d.data())));
      }
    }

    const vector = await createEmbedding(`Urdu poetry about ${mood}`);
    return res.json(await nearest(vector, 10));
  } catch (err) {
    console.error("moodSearch error:", err);
    return res.status(500).json({error: "Mood search failed"});
  }
}
