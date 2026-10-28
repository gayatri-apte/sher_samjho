import type {Request, Response} from "express";
import {getFirestore} from "firebase-admin/firestore";

/**
 * GET /admin-analytics (requireAuth + requireAdmin in index.ts)
 * Previously ANY request with any Authorization header got the data.
 * Uses a count() aggregation instead of downloading every user doc.
 * @param {Request} _req - Express request
 * @param {Response} res - Express response
 * @return {Promise<void>}
 */
export async function adminAnalytics(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const db = getFirestore();
    const [stats, users, corpus] = await Promise.all([
      db.collection("analytics").doc("stats").get(),
      db.collection("users").count().get(),
      db.collection("global_poetry_cache").count().get(),
    ]);
    res.json({
      totalUsers: users.data().count,
      totalShers: corpus.data().count,
      ...(stats.data() || {}),
    });
  } catch (err) {
    console.error("adminAnalytics error:", err);
    res.status(500).json({error: "Analytics failed"});
  }
}
