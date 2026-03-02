import type {Request, Response} from "express";
import {getFirestore} from "firebase-admin/firestore";
import {getAuth} from "firebase-admin/auth";

/**
 * GET /admin-analytics
 * Returns aggregate app analytics plus total user count.
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @return {Promise<void>}
 */
export async function adminAnalytics(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) {
      res.status(403).json({error: "Unauthorized"});
      return;
    }

    const token = header.replace("Bearer ", "").trim();
    const decoded = await getAuth().verifyIdToken(token);

    if (!decoded.admin) {
      res.status(403).json({error: "Unauthorized"});
      return;
    }

    const db = getFirestore();

    const snap = await db
      .collection("analytics")
      .doc("stats")
      .get();
    const data = snap.data() || {};

    const userSnap = await db.collection("users").get();
    const totalUsers = userSnap.size;

    res.json({
      totalUsers,
      ...data,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("adminAnalytics error:", err);
    res.status(500).json({error: "Analytics failed"});
  }
}

