import type {DecodedIdToken} from "firebase-admin/auth";
import type {Request, Response} from "express";
import {saveScan} from "../db/scans.repo";

type AuthRequest = Request & {user?: DecodedIdToken};

/**
 * Handles saving scan history
 * @param {AuthRequest} req - Request (user attached by requireAuth)
 * @param {Response} res - Express response
 */
export async function saveHandler(req: AuthRequest, res: Response) {
  try {
    const uid = req.user?.uid;

    if (!uid) {
      return res.status(401).json({error: "Unauthorized"});
    }

    const {cacheHash} = req.body;

    if (!cacheHash) {
      return res.status(400).json({error: "cacheHash is required"});
    }

    // Save scan with optional imageHash (empty string if not provided)
    await saveScan(
      uid,
      cacheHash,
      req.body.imageHash || "",
      req.body.source || "upload"
    );

    return res.json({success: true});
  } catch (err: unknown) {
    const message = err instanceof Error ?
      err.message :
      "Unknown error";
    const code =
      typeof err === "object" && err !== null && "code" in err ?
        (err as {code: unknown}).code :
        undefined;
    console.error("Save error:", err);

    if (code === 5 || message.includes("NOT_FOUND")) {
      return res.status(503).json({
        error: "Firestore database not found. Create a Firestore database " +
          "in Firebase Console (Build > Firestore Database > Create database).",
        detail: message,
      });
    }

    return res.status(500).json({error: `Save failed: ${message}`});
  }
}
