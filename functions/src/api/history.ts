import type {DecodedIdToken} from "firebase-admin/auth";
import {getFirestore} from "firebase-admin/firestore";

import type {Request, Response} from "express";

type AuthRequest = Request & {user?: DecodedIdToken};

/**
 * Returns the authenticated user's scan history.
 * @param {AuthRequest} req - Request (user attached by requireAuth)
 * @param {Response} res - Express response
 */
export async function historyHandler(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user?.uid) {
      return res.status(401).json({error: "Unauthorized"});
    }
    const db = getFirestore();

    const snap = await db
      .collection("users")
      .doc(user.uid)
      .collection("scans")
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    const scans = snap.docs.map((d) => {
      const data = d.data();
      // Convert Firestore Timestamp to serializable format
      const createdAt = data.createdAt;
      let serializedCreatedAt;

      if (createdAt && typeof createdAt.toMillis === "function") {
        // Firestore Admin SDK Timestamp
        const millis = createdAt.toMillis();
        serializedCreatedAt = {
          seconds: Math.floor(millis / 1000),
          nanoseconds: (millis % 1000) * 1000000,
        };
      } else if (
        createdAt &&
        (createdAt.seconds !== undefined || createdAt._seconds !== undefined)
      ) {
        // Already has seconds property
        serializedCreatedAt = {
          seconds: createdAt.seconds || createdAt._seconds,
          nanoseconds: createdAt.nanoseconds || createdAt._nanoseconds || 0,
        };
      } else {
        serializedCreatedAt = createdAt;
      }

      return {
        id: d.id,
        ...data,
        createdAt: serializedCreatedAt,
      };
    });

    return res.json(scans);
  } catch (err: unknown) {
    const code =
      typeof err === "object" && err !== null && "code" in err ?
        (err as {code: unknown}).code :
        undefined;
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("History error:", err);

    // If Firestore returns NOT_FOUND (often means DB not initialized yet),
    // treat it as "no history" to keep the UI usable.
    if (code === 5 || message.includes("NOT_FOUND")) {
      return res.json([]);
    }

    return res.status(500).json({error: `Failed to fetch history: ${message}`});
  }
}
