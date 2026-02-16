import type {Request, Response} from "express";
import * as admin from "firebase-admin";
import {createEmbedding} from "../utils/embedding.js";

/**
 * Cosine similarity between two vectors.
 * @param {number[]} a - First vector
 * @param {number[]} b - Second vector
 * @return {number} Similarity in [-1, 1]
 */
function cosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return dot / (magA * magB);
}

/**
 * Mood-based discovery: embed mood query, return top matches by similarity.
 * @param {Request} req - Request with body.mood
 * @param {Response} res - Express response
 */
export async function moodSearch(req: Request, res: Response) {
  const db = admin.firestore();
  const {mood} = req.body;

  if (!mood) {
    return res.status(400).json({error: "Mood required"});
  }

  const moodEmbedding = await createEmbedding(String(mood));

  const snaps = await db.collection("global_poetry_cache").get();

  const results = snaps.docs
    .map((doc) => {
      const data = doc.data();
      const emb = data.embedding as number[] | undefined;
      if (!emb) return null;
      const score = cosineSimilarity(moodEmbedding, emb);
      return {...data, score};
    })
    .filter((x): x is NonNullable<typeof x> => x != null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return res.json(results);
}
