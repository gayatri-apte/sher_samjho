import type {Request, Response} from "express";
import * as admin from "firebase-admin";

/**
 * GET /official-recitations/:sherId
 * Returns famous/official recitations for a sher.
 * Firestore: official_recitations collection, documents with sherId field.
 * Structure: { poet, era, audioUrl, reciterName, source }
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getOfficialRecitations(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const {sherId} = req.params;
    if (!sherId) {
      res.status(400).json({error: "sherId is required"});
      return;
    }

    const snap = await admin
      .firestore()
      .collection("official_recitations")
      .where("sherId", "==", sherId)
      .get();

    const list = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({recitations: list});
  } catch (err) {
    console.error("getOfficialRecitations error:", err);
    res.status(500).json({error: "Failed to fetch recitations"});
  }
}
