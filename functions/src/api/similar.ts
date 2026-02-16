import type {Request, Response} from "express";
import * as admin from "firebase-admin";

/**
 * Find similar sher by computing cosine similarity with embeddings.
 * @param {Request} req - Request with body.textHash
 * @param {Response} res - Express response
 */
export async function similarSher(req: Request, res: Response): Promise<void> {
  const db = admin.firestore();
  const {textHash} = req.body;

  if (!textHash) {
    res.status(400).json({error: "textHash required"});
    return;
  }

  const doc = await db
    .collection("global_poetry_cache")
    .doc(textHash)
    .get();

  if (!doc.exists) {
    res.status(404).json({error: "Sher not found"});
    return;
  }

  const baseEmbedding = doc.data()?.embedding as number[] | undefined;

  if (!baseEmbedding) {
    res.status(400).json({error: "Sher has no embedding"});
    return;
  }

  const snaps = await db.collection("global_poetry_cache").get();

  const results = snaps.docs
    .filter((d) => d.id !== textHash)
    .map((d) => {
      const data = d.data();
      const emb = data.embedding as number[] | undefined;
      if (!emb) return null;
      const score = cosineSimilarity(baseEmbedding, emb);
      return {
        id: d.id,
        devanagariText: data.devanagariText,
        score,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x != null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  res.json(results);
}

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
