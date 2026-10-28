import type {Request, Response} from "express";
import {getFirestore} from "firebase-admin/firestore";
import {toPublicSher} from "../utils/vectors";

/**
 * Era-based search over the global poetry cache.
 * @param {Request} req - Express request containing the era in the body.
 * @param {Response} res - Express response used to return search results.
 */
export async function eraSearch(req: Request, res: Response) {
  try {
    const era = String(req.body?.era ?? "").trim();
    if (!era) return res.status(400).json({error: "era is required"});

    const snap = await getFirestore()
      .collection("global_poetry_cache")
      .where("era", "==", era)
      .limit(20)
      .get();
    return res.json(snap.docs.map((d) => toPublicSher(d.id, d.data())));
  } catch (err) {
    console.error("Era search error:", err);
    return res.status(500).json({error: "Era search failed"});
  }
}
