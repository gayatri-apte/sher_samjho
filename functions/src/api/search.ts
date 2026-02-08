import type {Request, Response} from "express";
import * as admin from "firebase-admin";
import {createEmbedding} from "../utils/embedding.js";

/**
 * Semantic search over global poetry cache using query embedding and cosine
 * similarity. Returns top 5 matches with devanagariText, tashreeh, score.
 * @param {Request} req - Express request with body.query
 * @param {Response} res - Express response
 */
export async function semanticSearch(req: Request, res: Response) {
  const db = admin.firestore();
  const {query} = req.body;

  if (!query) {
    return res.status(400).json({error: "Query required"});
  }

  const queryEmbedding = await createEmbedding(query);
  const snaps = await db.collection("global_poetry_cache").get();

  type Result = { devanagariText: unknown; tashreeh: unknown; score: number };
  const results: Result[] = snaps.docs
    .map((doc) => {
      const data = doc.data();
      if (!data.embedding) return null;

      const score = cosineSimilarity(
        queryEmbedding,
        data.embedding as number[]
      );
      return {
        devanagariText: data.devanagariText,
        tashreeh: data.tashreeh,
        score,
      };
    })
    .filter((x): x is Result => x != null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return res.json(results);
}

/**
 * Computes cosine similarity between two vectors.
 * @param {number[]} a - First embedding vector
 * @param {number[]} b - Second embedding vector
 * @return {number} Similarity in [-1, 1]
 */
function cosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return dot / (magA * magB);
}
