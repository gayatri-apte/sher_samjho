import type {DecodedIdToken} from "firebase-admin/auth";
import type {Request, Response} from "express";
import {getFirestore, Timestamp, FieldValue} from "firebase-admin/firestore";
import {createEmbedding} from "../utils/embedding.js";
import {updateStreak} from "../utils/streak.js";

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

    const {cacheHash, hash, text, explanation, devanagariText, tashreeh} =
      req.body as {
        cacheHash?: string;
        hash?: string;
        text?: string;
        explanation?: string;
        devanagariText?: string;
        tashreeh?: string;
      };

    const id = cacheHash || hash;

    if (!id || !text) {
      return res.status(400).json({
        error: "cacheHash (or hash) and text are required",
      });
    }

    const db = getFirestore();

    await db
      .collection("users")
      .doc(uid)
      .collection("scans")
      .doc(id) // doc ID = cacheHash/hash
      .set(
        {
          uid,
          cacheHash: id,
          text,
          explanation: explanation ?? tashreeh,
          devanagariText: devanagariText ?? text,
          tashreeh: tashreeh ?? explanation,
          createdAt: Timestamp.now(),
        },
        {merge: true}
      );

    const textForCache = devanagariText ?? text ?? "";
    if (textForCache) {
      const embedding = await createEmbedding(textForCache);
      await db
        .collection("global_poetry_cache")
        .doc(id)
        .set(
          {
            embedding,
            devanagariText: textForCache,
            tashreeh: tashreeh ?? explanation,
            updatedAt: FieldValue.serverTimestamp(),
          },
          {merge: true}
        );
    }

    const userRef = db.collection("users").doc(uid);
    const snap = await userRef.get();
    const today = new Date().toISOString().slice(0, 10);
    const newStreak = updateStreak(snap.data() || {});

    await userRef.set(
      {
        streak: newStreak,
        lastActiveDate: today,
      },
      {merge: true}
    );

    return res.json({success: true});
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error";
    const code =
      typeof err === "object" && err !== null && "code" in err ?
        (err as {code: unknown}).code :
        undefined;

    console.error("Save error:", err);

    if (code === 5 || message.includes("NOT_FOUND")) {
      return res.status(503).json({
        error:
          "Firestore database not found. Create a Firestore database " +
          "in Firebase Console (Build > Firestore Database > Create database).",
        detail: message,
      });
    }

    return res.status(500).json({error: `Save failed: ${message}`});
  }
}
