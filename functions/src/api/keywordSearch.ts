import type {Request, Response} from "express";
import {getFirestore} from "firebase-admin/firestore";
import {generateKeywords} from "../utils/keywords";
import {toPublicSher} from "../utils/vectors";

/**
 * Keyword search over global_poetry_cache.
 * Previously the whole query was treated as ONE keyword, so any multi-word
 * search ("dil dard") returned nothing. Now each word is matched
 * (array-contains-any) and results are ranked by how many words hit.
 * @param {Request} req - Request with body.query
 * @param {Response} res - Express response
 */
export async function keywordSearch(req: Request, res: Response) {
  try {
    const query = String(req.body?.query ?? "").trim();
    if (!query) return res.status(400).json({error: "Query required"});

    const words = generateKeywords(query).slice(0, 30);
    if (words.length === 0) return res.json([]);

    const snap = await getFirestore()
      .collection("global_poetry_cache")
      .where("keywords", "array-contains-any", words)
      .limit(20)
      .get();

    const ranked = snap.docs
      .map((d) => {
        const kws = (d.data().keywords as string[] | undefined) ?? [];
        const hits = words.filter((w) => kws.includes(w)).length;
        return toPublicSher(d.id, d.data(), hits / words.length);
      })
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 10);

    return res.json(ranked);
  } catch (err) {
    console.error("keywordSearch error:", err);
    return res.status(500).json({error: "Keyword search failed"});
  }
}
