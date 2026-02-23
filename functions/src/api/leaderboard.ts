import type {Request, Response} from "express";
import {getFirestore} from "firebase-admin/firestore";

/**
 * GET /leaderboard
 * Returns top learners ranked primarily by longestStreak.
 * Frontend can display streak, totalReviews, totalScans, masteryScore, etc.
 *
 * For now we order by longestStreak desc and limit to 20 users.
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function leaderboard(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const db = getFirestore();
    const snaps = await db
      .collection("users")
      .orderBy("longestStreak", "desc")
      .limit(20)
      .get();

    const data = snaps.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(data);
  } catch (err) {
    console.error("leaderboard error:", err);
    res.status(500).json({error: "Failed to load leaderboard"});
  }
}

