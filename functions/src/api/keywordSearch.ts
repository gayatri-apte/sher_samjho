import type {Request, Response} from "express";
import * as admin from "firebase-admin";

/**
 * Keyword search over global_poetry_cache using array-contains.
 * @param {Request} req - Request with body.query
 * @param {Response} res - Express response
 */
export async function keywordSearch(req: Request, res: Response) {
  const db = admin.firestore();
  const {query} = req.body;

  if (!query) {
    return res.status(400).json({error: "Query required"});
  }

  const keyword = String(query).toLowerCase();

  const snap = await db
    .collection("global_poetry_cache")
    .where("keywords", "array-contains", keyword)
    .limit(10)
    .get();

  const results = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return res.json(results);
}
