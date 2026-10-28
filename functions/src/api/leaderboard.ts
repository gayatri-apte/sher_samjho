import type {Request, Response} from "express";
import {getFirestore} from "firebase-admin/firestore";

/**
 * GET /leaderboard — top learners by longest streak.
 * Only public fields are returned. Previously the full user documents
 * (including email addresses) were sent to every visitor.
 * @param {Request} _req - Express request
 * @param {Response} res - Express response
 */
export async function leaderboard(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const snaps = await getFirestore()
      .collection("users")
      .orderBy("longestStreak", "desc")
      .limit(20)
      .get();

    const data = snaps.docs.map((doc) => {
      const d = doc.data();
      const email = typeof d.email === "string" ? d.email : "";
      const name =
        d.displayName ||
        (email ? `${email.split("@")[0].slice(0, 3)}***` : "Guest learner");
      return {
        id: doc.id,
        displayName: name,
        longestStreak: d.longestStreak ?? 0,
        currentStreak: d.currentStreak ?? 0,
        streak: d.currentStreak ?? d.streak ?? 0,
        totalScans: d.totalScans ?? 0,
        totalReviews: d.totalReviews ?? 0,
        totalRecitations: d.totalRecitations ?? 0,
        bestRecitationScore: d.bestRecitationScore ?? 0,
        masteryScore: d.masteryScore ?? 0,
      };
    });
    res.json(data);
  } catch (err) {
    console.error("leaderboard error:", err);
    res.status(500).json({error: "Failed to load leaderboard"});
  }
}
