import type {Response} from "express";
import {getFirestore, FieldValue, Timestamp} from "firebase-admin/firestore";
import {sm2, strengthOf, DEFAULT_SRS, type SrsState} from "../utils/sm2";
import {createHash} from "../utils/hash";
import {incrementStat} from "../utils/updateAnalytics";
import {updateUserStats} from "../utils/updateUserStats";
import type {AuthRequest} from "../guards/auth.guard";

/*
 * One vocabulary deck per user: users/{uid}/vocabulary/{wordId}.
 * (The old code had two parallel decks, `words` and `vocabulary`, and the
 * "SM-2" just added the rating to a number. This is real SM-2 with
 * easiness, interval and a due date.)
 */

export type DeckSource = "dictionary" | "ustad" | "manual";

export type VocabularyEntry = {
  id: string;
  word: string;
  meaning: string;
  roman?: string;
  tip?: string;
  source?: DeckSource;
  strength: number;
  easiness: number;
  interval: number;
  repetitions: number;
  dueAt: number | null; // epoch ms
  isDue: boolean;
  mistakes: number;
  lastReviewed: {seconds: number} | null;
  addedAt: {seconds: number} | null;
};

/**
 * Stable id for a word so the same word is never added twice.
 * @param {string} word - The word
 * @return {string} Document id
 */
export function wordId(word: string): string {
  return createHash(word.trim().normalize("NFC")).slice(0, 32);
}

const ts = (v: unknown) =>
  v instanceof Timestamp ? {seconds: v.seconds} : null;

/**
 * Adds (or bumps) words in a user's deck. Used by the dictionary popup and by
 * the Ustad coach, which pushes mispronounced words in automatically.
 * Re-adding an existing word makes it due now and counts a mistake.
 * @param {string} uid - User id
 * @param {Array} words - Words to add
 * @param {DeckSource} source - Where the words came from
 * @return {Promise<number>} Number of words written
 */
export async function addWordsToDeck(
  uid: string,
  words: Array<{word: string; meaning?: string; roman?: string; tip?: string}>,
  source: DeckSource,
): Promise<number> {
  const db = getFirestore();
  const col = db.collection("users").doc(uid).collection("vocabulary");
  const batch = db.batch();
  let n = 0;
  for (const w of words.slice(0, 25)) {
    const word = (w.word || "").trim();
    if (!word) continue;
    const ref = col.doc(wordId(word));
    const snap = await ref.get();
    if (snap.exists) {
      batch.set(ref, {
        dueAt: Timestamp.now(),
        mistakes: FieldValue.increment(source === "ustad" ? 1 : 0),
        ...(w.tip ? {tip: w.tip} : {}),
        ...(w.meaning && !snap.data()?.meaning ? {meaning: w.meaning} : {}),
      }, {merge: true});
    } else {
      batch.set(ref, {
        word,
        meaning: (w.meaning || "").trim(),
        roman: (w.roman || "").trim(),
        tip: (w.tip || "").trim(),
        source,
        ...DEFAULT_SRS,
        strength: 0,
        mistakes: source === "ustad" ? 1 : 0,
        dueAt: Timestamp.now(),
        lastReviewed: null,
        addedAt: FieldValue.serverTimestamp(),
      });
    }
    n++;
  }
  if (n) await batch.commit();
  return n;
}

/**
 * GET /vocabulary[?due=1] — the user's deck, due words first.
 * @param {AuthRequest} req - Request (user attached by requireAuth)
 * @param {Response} res - Express response
 */
export async function getVocabularyHandler(req: AuthRequest, res: Response) {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({error: "Unauthorized"});

    const snap = await getFirestore()
      .collection("users").doc(uid).collection("vocabulary")
      .orderBy("addedAt", "desc")
      .limit(500)
      .get();

    const now = Date.now();
    let words: VocabularyEntry[] = snap.docs.map((doc) => {
      const d = doc.data();
      const dueAt = d.dueAt instanceof Timestamp ? d.dueAt.toMillis() : null;
      const srs: SrsState = {
        easiness: Number(d.easiness) || DEFAULT_SRS.easiness,
        interval: Number(d.interval) || 0,
        repetitions: Number(d.repetitions) || 0,
      };
      return {
        id: doc.id,
        word: d.word ?? "",
        meaning: d.meaning ?? "",
        roman: d.roman ?? "",
        tip: d.tip ?? "",
        source: d.source ?? "dictionary",
        strength: typeof d.strength === "number" ? d.strength : strengthOf(srs),
        ...srs,
        dueAt,
        isDue: dueAt == null || dueAt <= now,
        mistakes: Number(d.mistakes) || 0,
        lastReviewed: ts(d.lastReviewed),
        addedAt: ts(d.addedAt),
      };
    });

    if (req.query.due === "1") words = words.filter((w) => w.isDue);
    words.sort((a, b) => Number(b.isDue) - Number(a.isDue));
    return res.json(words);
  } catch (err: unknown) {
    console.error("Get vocabulary error:", err);
    return res.status(500).json({error: "Failed to load vocabulary"});
  }
}

/**
 * POST /vocabulary — save a word. Body: { word, meaning?, roman? }
 * @param {AuthRequest} req - Request (user attached by requireAuth)
 * @param {Response} res - Express response
 */
export async function saveVocabularyHandler(req: AuthRequest, res: Response) {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({error: "Unauthorized"});

    const {word, meaning, roman} =
      req.body as {word?: string; meaning?: string; roman?: string};
    if (!word || typeof word !== "string" || !word.trim()) {
      return res.status(400).json({error: "word is required"});
    }
    const cleanMeaning =
      typeof meaning === "string" && meaning !== "Loading…" ? meaning : "";
    await addWordsToDeck(
      uid, [{word, meaning: cleanMeaning, roman}], "dictionary",
    );
    return res.json({success: true, id: wordId(word)});
  } catch (err: unknown) {
    console.error("Save vocabulary error:", err);
    return res.status(500).json({error: "Save failed"});
  }
}

/**
 * Applies an SM-2 review to one word.
 * @param {string} uid - User id
 * @param {string} id - Word doc id
 * @param {number} quality - 0–5
 * @return {Promise<object | null>} New SRS values or null if missing
 */
async function applyReview(uid: string, id: string, quality: number) {
  const ref = getFirestore()
    .collection("users").doc(uid).collection("vocabulary").doc(id);
  const doc = await ref.get();
  if (!doc.exists) return null;
  const d = doc.data() || {};
  const next = sm2({
    easiness: Number(d.easiness) || DEFAULT_SRS.easiness,
    interval: Number(d.interval) || 0,
    repetitions: Number(d.repetitions) || 0,
  }, quality);
  const strength = strengthOf(next);
  const dueAt = Timestamp.fromMillis(Date.now() + next.interval * 86400000);
  await ref.update({
    ...next,
    strength,
    dueAt,
    lastReviewed: FieldValue.serverTimestamp(),
  });
  await Promise.all([
    updateUserStats(uid, "totalReviews"),
    incrementStat("totalReviews"),
  ]);
  return {...next, strength, dueAt: dueAt.toMillis()};
}

/**
 * PATCH /vocabulary/:id/review — Body: { quality: 0–5 }
 * @param {AuthRequest} req - Request (user attached by requireAuth)
 * @param {Response} res - Express response
 */
export async function reviewVocabularyHandler(req: AuthRequest, res: Response) {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({error: "Unauthorized"});
    const id = String(req.params.id || "");
    const q = Number((req.body as {quality?: number}).quality);
    if (!id) return res.status(400).json({error: "id is required"});
    if (!Number.isFinite(q) || q < 0 || q > 5) {
      return res.status(400).json({error: "quality must be a number 0–5"});
    }
    const out = await applyReview(uid, id, q);
    if (!out) return res.status(404).json({error: "Word not found"});
    return res.json({success: true, ...out});
  } catch (err: unknown) {
    console.error("Review vocabulary error:", err);
    return res.status(500).json({error: "Review failed"});
  }
}

/**
 * PUT /word/review — legacy alias. Body: { wordId, rating }
 * @param {AuthRequest} req - Request
 * @param {Response} res - Express response
 */
export async function legacyWordReviewHandler(
  req: AuthRequest, res: Response,
) {
  const {wordId: id, rating} = req.body as {wordId?: string; rating?: number};
  req.params.id = String(id || "");
  req.body = {quality: rating};
  return reviewVocabularyHandler(req, res);
}
