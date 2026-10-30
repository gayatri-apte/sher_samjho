import type {Response} from "express";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import type {Part} from "@google/generative-ai";
import type {AuthRequest} from "../guards/auth.guard";
import {audioPart, generateJSON} from "../services/gemini.service";
import {
  baitBaziPrompt, baitBaziSchema,
  FIND_SHER_PROMPT, findSherSchema,
  recitePrompt, reciteSchema,
  TRANSCRIBE_PROMPT, transcribeSchema,
} from "../prompts/voice";
import {addWordsToDeck} from "./vocabulary";
import {updateUserStats} from "../utils/updateUserStats";
import {incrementStat} from "../utils/updateAnalytics";
import {sendError} from "../utils/aiErrors";
import {createEmbedding} from "../utils/embedding";
import {nearest} from "../utils/corpus";

const AUDIO_TYPES = new Set([
  "audio/wav", "audio/x-wav", "audio/webm", "audio/ogg", "audio/mp4",
  "audio/mpeg", "audio/mp3", "audio/aac", "audio/flac",
]);
const MAX_AUDIO_BYTES = 5 * 1024 * 1024; // ~2.5 min of 16 kHz mono WAV

type AudioIn = {audio?: string; mimeType?: string};

/**
 * Reads and validates base64 audio from the request body.
 * @param {AudioIn} body - Request body
 * @return {Part | string} Gemini audio part, or an error message string
 */
function readAudio(body: AudioIn): Part | string {
  const b64 = String(body.audio || "").replace(/^data:[^,]+,/, "");
  if (!b64) return "audio is required";
  const mime = (body.mimeType || "audio/wav").split(";")[0].toLowerCase();
  if (!AUDIO_TYPES.has(mime)) return `Unsupported audio type: ${mime}`;
  const bytes = Math.floor((b64.length * 3) / 4);
  if (bytes < 2000) {
    return "Recording is too short — hold the button and speak.";
  }
  if (bytes > MAX_AUDIO_BYTES) return "Recording is too long (max ~2 minutes).";
  return audioPart(b64, mime === "audio/x-wav" ? "audio/wav" : mime);
}

/**
 * Maps AI/SDK errors to friendly HTTP responses.
 * @param {Response} res - Express response
 * @param {unknown} err - Error
 * @param {string} what - Feature name for logs
 */
async function fail(res: Response, err: unknown, what: string) {
  await sendError(res, err, what);
}

export type WordVerdict = {
  ref: string;
  roman: string;
  heard: string;
  status: "correct" | "mispronounced" | "missed" | "extra";
  issue: string;
  tip: string;
  meaning: string;
};

export type ReciteResult = {
  transcript: string;
  audioQuality: "good" | "noisy" | "silent" | "unrelated";
  overallScore: number;
  pronunciationScore: number;
  fluencyScore: number;
  completenessScore: number;
  words: WordVerdict[];
  ustadSays: string;
  deliveryTips: string[];
};

const clamp = (n: unknown) =>
  Math.max(0, Math.min(100, Math.round(Number(n) || 0)));

/**
 * POST /voice/recite — Ustad, the AI recitation coach.
 * Body: { audio, mimeType, sherId? , referenceText? }
 * Listens to the learner, aligns against the reference sher word-by-word,
 * flags talaffuz mistakes (qaaf/kaaf, ḳhe/khe, izafat, ain…), and pushes
 * every mispronounced/missed word into the learner's SM-2 deck.
 * @param {AuthRequest} req - Request (auth required)
 * @param {Response} res - Express response
 */
export async function reciteHandler(req: AuthRequest, res: Response) {
  try {
    const uid = req.user?.uid;
    const body =
      req.body as AudioIn & {sherId?: string; referenceText?: string};
    const audio = readAudio(body);
    if (typeof audio === "string") {
      res.status(400).json({error: audio});
      return;
    }

    let ref: {devanagari: string; urdu?: string; roman?: string; poet?: string};
    if (body.sherId) {
      const snap = await getFirestore()
        .collection("global_poetry_cache").doc(String(body.sherId)).get();
      const d = snap.data();
      if (!d) {
        res.status(404).json({error: "Sher not found"});
        return;
      }
      ref = {
        devanagari: d.devanagariText ?? d.text ?? "",
        urdu: d.rawUrdu,
        roman: d.romanText,
        poet: d.poet,
      };
    } else {
      ref = {devanagari: String(body.referenceText || "").trim()};
    }
    if (!ref.devanagari || ref.devanagari.length > 1200) {
      res.status(400).json({
        error: "A reference sher (sherId or referenceText) is required.",
      });
      return;
    }

    const raw = await generateJSON<ReciteResult>(
      [recitePrompt(ref), audio], reciteSchema, 0.1,
    );

    const words = (raw.words || []).slice(0, 80);
    const result: ReciteResult = {
      ...raw,
      words,
      overallScore: clamp(raw.overallScore),
      pronunciationScore: clamp(raw.pronunciationScore),
      fluencyScore: clamp(raw.fluencyScore),
      completenessScore: clamp(raw.completenessScore),
      deliveryTips: (raw.deliveryTips || []).slice(0, 3),
    };

    const toPractice = words.filter(
      (w) => w.status === "mispronounced" || w.status === "missed",
    );

    let addedToDeck = 0;
    if (uid) {
      const goodAudio =
        result.audioQuality === "good" || result.audioQuality === "noisy";
      if (goodAudio && toPractice.length) {
        addedToDeck = await addWordsToDeck(
          uid,
          toPractice.map((w) => ({
            word: w.ref,
            meaning: w.meaning,
            roman: w.roman,
            tip: w.tip || w.issue,
          })),
          "ustad",
        );
      }

      const db = getFirestore();
      const userRef = db.collection("users").doc(uid);
      const userDoc = await userRef.get();
      const best = Number(userDoc.data()?.bestRecitationScore) || 0;
      await Promise.all([
        userRef.collection("recitationAttempts").add({
          sherId: body.sherId ?? null,
          reference: ref.devanagari,
          overallScore: result.overallScore,
          pronunciationScore: result.pronunciationScore,
          fluencyScore: result.fluencyScore,
          mistakes: toPractice.map((w) => ({ref: w.ref, issue: w.issue})),
          createdAt: FieldValue.serverTimestamp(),
        }),
        updateUserStats(uid, "totalRecitations", {
          bestRecitationScore: Math.max(best, result.overallScore),
        }),
      ]);
    }
    await incrementStat("totalRecitations");

    res.json({
      ...result,
      reference: ref,
      mistakes: toPractice.length,
      addedToDeck,
      aiGenerated: true,
    });
  } catch (err) {
    await fail(res, err, "Recitation check");
  }
}

/**
 * POST /voice/transcribe — speech to text for voice questions.
 * Body: { audio, mimeType }
 * @param {AuthRequest} req - Request
 * @param {Response} res - Express response
 */
export async function transcribeHandler(req: AuthRequest, res: Response) {
  try {
    const audio = readAudio(req.body as AudioIn);
    if (typeof audio === "string") {
      res.status(400).json({error: audio});
      return;
    }
    const out = await generateJSON<{text: string; language: string}>(
      [TRANSCRIBE_PROMPT, audio], transcribeSchema, 0,
    );
    res.json({text: (out.text || "").trim(), language: out.language || ""});
  } catch (err) {
    await fail(res, err, "Transcription");
  }
}

type FindSherOut = {
  heard: string;
  identified: {
    found: boolean;
    devanagari: string;
    roman: string;
    poet: string;
    meaning: string;
    confidence: number;
  };
  searchQuery: string;
};

/**
 * POST /voice/find-sher — "Ek sher tha…"
 * Body: { audio?, mimeType?, text? } — speak or type a half-remembered line.
 * Returns the AI's identification (only when confident) plus the closest
 * matches from the app's own corpus.
 * @param {AuthRequest} req - Request
 * @param {Response} res - Express response
 */
export async function findSherHandler(req: AuthRequest, res: Response) {
  try {
    const body = req.body as AudioIn & {text?: string};
    const parts: Array<string | Part> = [FIND_SHER_PROMPT];
    if (body.audio) {
      const audio = readAudio(body);
      if (typeof audio === "string") {
        res.status(400).json({error: audio});
        return;
      }
      parts.push(audio);
    } else {
      const text = String(body.text || "").trim();
      if (!text) {
        res.status(400).json({error: "Speak or type a line you remember."});
        return;
      }
      parts.push(`Typed fragment: ${text.slice(0, 300)}`);
    }

    const out = await generateJSON<FindSherOut>(parts, findSherSchema, 0.1);
    const id = out.identified;
    const confident = !!id?.found && Number(id.confidence) >= 0.6 &&
      !!id.devanagari?.trim();

    const basis = [confident ? id.devanagari : "", out.heard, out.searchQuery]
      .filter(Boolean).join("\n");
    const matches = basis ?
      await nearest(await createEmbedding(basis), 5, undefined, 0.55) :
      [];

    await incrementStat("totalVoiceSearches");
    res.json({
      heard: out.heard,
      identified: confident ? {...id, confidence: Number(id.confidence)} : null,
      matches,
      aiGenerated: true,
    });
  } catch (err) {
    await fail(res, err, "Sher search");
  }
}

type BaitBaziOut = {
  heard: string;
  isRecognizedSher: boolean;
  poet: string;
  firstLetter: string;
  lastLetter: string;
  followsRule: boolean;
  points: number;
  verdict: string;
  aiSher: {devanagari: string; roman: string; poet: string; meaning: string};
  nextLetter: string;
};

/**
 * POST /voice/baitbazi — one turn of the bait-bazi couplet duel vs the AI.
 * Body: { audio? , mimeType?, text?, requiredLetter?, used?: string[] }
 * @param {AuthRequest} req - Request
 * @param {Response} res - Express response
 */
export async function baitBaziHandler(req: AuthRequest, res: Response) {
  try {
    const body = req.body as AudioIn & {
      text?: string;
      requiredLetter?: string | null;
      used?: string[];
    };
    const used = Array.isArray(body.used) ?
      body.used.map((u) => String(u).slice(0, 200)).slice(-20) :
      [];
    const parts: Array<string | Part> = [
      baitBaziPrompt(body.requiredLetter || null, used),
    ];
    if (body.audio) {
      const audio = readAudio(body);
      if (typeof audio === "string") {
        res.status(400).json({error: audio});
        return;
      }
      parts.push(audio);
    } else {
      const text = String(body.text || "").trim();
      if (!text) {
        res.status(400).json({error: "Recite or type your sher."});
        return;
      }
      parts.push(`Player's sher (typed): ${text.slice(0, 400)}`);
    }

    const out = await generateJSON<BaitBaziOut>(parts, baitBaziSchema, 0.4);
    const points = out.followsRule && out.isRecognizedSher ?
      Math.max(0, Math.min(10, Math.round(Number(out.points) || 0))) :
      0;

    await incrementStat("totalBaitBaziTurns");
    res.json({...out, points, aiGenerated: true});
  } catch (err) {
    await fail(res, err, "Bait-bazi");
  }
}
