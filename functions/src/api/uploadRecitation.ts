import type {Response} from "express";
import {getStorage} from "firebase-admin/storage";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {randomUUID} from "crypto";
import {incrementStat} from "../utils/updateAnalytics";
import type {AuthRequest} from "../guards/auth.guard";

const EXT: Record<string, string> = {
  "audio/webm": "webm",
  "audio/wav": "wav",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
};

/**
 * POST /upload-recitation
 * Body: { sherId, audioBase64, mimeType?, score? }
 * Saves audio to Cloud Storage with a Firebase download token, so the URL
 * actually plays (the old storage.googleapis.com URL was a private object
 * and returned 403).
 * @param {AuthRequest} req - Authenticated request
 * @param {Response} res - Express response
 */
export async function uploadRecitation(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      res.status(401).json({error: "Unauthorized"});
      return;
    }
    const {sherId, audioBase64, mimeType, score} = req.body as {
      sherId?: string;
      audioBase64?: string;
      mimeType?: string;
      score?: number;
    };
    if (!sherId || !audioBase64) {
      res.status(400).json({error: "sherId and audioBase64 are required"});
      return;
    }
    const buffer = Buffer.from(audioBase64, "base64");
    if (buffer.length > 6 * 1024 * 1024) {
      res.status(413).json({error: "Recording too long"});
      return;
    }
    const type = mimeType && EXT[mimeType] ? mimeType : "audio/webm";
    const bucket = getStorage().bucket();
    const filename = `recitations/${uid}/${randomUUID()}.${EXT[type]}`;
    const token = randomUUID();

    await bucket.file(filename).save(buffer, {
      contentType: type,
      metadata: {metadata: {firebaseStorageDownloadTokens: token}},
    });

    const url =
      `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/` +
      `${encodeURIComponent(filename)}?alt=media&token=${token}`;

    await getFirestore().collection("recitations").add({
      uid,
      sherId,
      audioUrl: url,
      score: typeof score === "number" ? score : null,
      createdAt: FieldValue.serverTimestamp(),
    });
    await incrementStat("totalRecitations");

    res.json({success: true, url});
  } catch (err) {
    console.error("uploadRecitation error:", err);
    res.status(500).json({error: "Upload failed"});
  }
}
