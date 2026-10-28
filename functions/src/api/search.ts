import type {Request, Response} from "express";
import {createEmbedding} from "../utils/embedding.js";
import {nearest} from "../utils/corpus";

/**
 * Semantic search over the global poetry cache (meaning-based).
 * Body: { query: string, limit?: number }
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function semanticSearch(req: Request, res: Response) {
  try {
    const query = String(req.body?.query ?? "").trim();
    if (!query) return res.status(400).json({error: "Query required"});
    if (query.length > 500) {
      return res.status(400).json({error: "Query too long"});
    }
    const limit = Math.min(20, Math.max(1, Number(req.body?.limit) || 5));
    const vector = await createEmbedding(query);
    return res.json(await nearest(vector, limit, undefined, 0.3));
  } catch (err) {
    console.error("semanticSearch error:", err);
    return res.status(500).json({error: "Search failed"});
  }
}
