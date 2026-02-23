import type {Request, Response} from "express";
import * as admin from "firebase-admin";
import {randomUUID} from "crypto";
import {incrementStat} from "../utils/updateAnalytics";

/**
 * POST /upload-recitation
 * Saves a user's audio recitation to Cloud Storage and records metadata
 * in Firestore under the recitations collection.
 *
 * @param {Request} req - Authenticated request (user set by middleware)
 * @param {Response} res - Express response
 */
export async function uploadRecitation(
  req: Request & {user?: {uid: string}},
  res: Response
): Promise<void> {
  try {
    const bucket = admin.storage().bucket();
    const uid = req.user?.uid;
    if (!uid) {
      res.status(401).json({error: "Unauthorized"});
      return;
    }

    const {sherId, audioBase64} = req.body as {
      sherId?: string;
      audioBase64?: string;
    };
    if (!sherId || !audioBase64) {
      res.status(400).json({error: "sherId and audioBase64 are required"});
      return;
    }

    const buffer = Buffer.from(audioBase64, "base64");
    const filename = `recitations/${uid}/${randomUUID()}.webm`;
    const file = bucket.file(filename);

    await file.save(buffer, {
      contentType: "audio/webm",
    });

    const url = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    await admin
      .firestore()
      .collection("recitations")
      .add({
        uid,
        sherId,
        audioUrl: url,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    await incrementStat("totalRecitations");

    res.json({success: true, url});
  } catch (err) {
    console.error("uploadRecitation error:", err);
    res.status(500).json({error: "Upload failed"});
  }
}
