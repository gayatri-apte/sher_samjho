import type {DecodedIdToken} from "firebase-admin/auth";
import {getFirestore} from "firebase-admin/firestore";

import type {Request, Response} from "express";

type AuthRequest = Request & {user?: DecodedIdToken};

/**
 * Returns a single scan for the authenticated user.
 * @param {AuthRequest} req - Request (user + scanId from params)
 * @param {Response} res - Express response
 */
export async function getScanHandler(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user?.uid) {
      return res.status(401).json({error: "Unauthorized"});
    }

    const scanId = String(req.params.scanId || "");
    if (!scanId) {
      return res.status(400).json({error: "Scan ID required"});
    }

    const db = getFirestore();
    const docRef = db
      .collection("users")
      .doc(user.uid)
      .collection("scans")
      .doc(scanId);

    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({error: "Scan not found"});
    }

    const data = snap.data();
    if (!data) {
      return res.status(404).json({error: "Scan not found"});
    }

    let createdAt = data.createdAt;
    const ts = createdAt as {toMillis?: () => number} | undefined;
    if (createdAt && typeof ts?.toMillis === "function") {
      const millis = ts.toMillis();
      createdAt = {
        seconds: Math.floor(millis / 1000),
        nanoseconds: (millis % 1000) * 1000000,
      };
    }

    return res.json({
      id: snap.id,
      ...data,
      createdAt,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Get scan error:", err);
    return res.status(500).json({error: `Failed to load scan: ${message}`});
  }
}
