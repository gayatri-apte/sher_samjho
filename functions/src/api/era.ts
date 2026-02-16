import type {Request, Response} from "express";
import * as admin from "firebase-admin";

/**
 * Handles era-based search over the global poetry cache.
 *
 * @param {Request} req - Express request containing the era in the body.
 * @param {Response} res - Express response used to return search results.
 */
export async function eraSearch(req: Request, res: Response) {
  try {
    const {era} = req.body as {era?: string};

    if (!era) {
      return res.status(400).json({error: "era is required"});
    }

    const db = admin.firestore();
    const snap = await db
      .collection("global_poetry_cache")
      .where("era", "==", era)
      .limit(20)
      .get();

    const results = snap.docs.map((d) => d.data());

    return res.json(results);
  } catch (err) {
    console.error("Era search error:", err);
    return res.status(500).json({error: "Era search failed"});
  }
}

