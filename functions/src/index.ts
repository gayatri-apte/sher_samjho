import {onRequest} from "firebase-functions/v2/https";
import {setGlobalOptions} from "firebase-functions/v2";
import * as admin from "firebase-admin";
import {initializeFirestore} from "firebase-admin/firestore";
import express from "express";
import cors from "cors";
import {
  requireAuth,
  optionalAuth,
  requireAdmin,
} from "./guards/auth.guard";
import {rateLimit} from "./guards/rateLimit";
import {ocrHandler} from "./api/ocr";
import {tashreehHandler} from "./api/tashreeh";
import {getScanHandler} from "./api/scan";
import {historyHandler} from "./api/history";
import {saveHandler} from "./api/save";
import {dictionaryHandler} from "./api/dictionary";
import {
  getVocabularyHandler,
  saveVocabularyHandler,
  reviewVocabularyHandler,
} from "./api/vocabulary";
import {saveWordHandler} from "./api/saveWord";
import {wordReviewHandler} from "./api/wordReview";
import {semanticSearch} from "./api/search";
import {keywordSearch} from "./api/keywordSearch";
import {moodSearch} from "./api/mood";
import {similarSher} from "./api/similar";
import {eraSearch} from "./api/era";
import {poetryChat} from "./api/poetryChat";
import {poetryComplete} from "./api/poetryComplete";
import {ttsHandler} from "./api/tts";
import {uploadRecitation} from "./api/uploadRecitation";
import {getOfficialRecitations} from "./api/officialRecitations";
import {leaderboard} from "./api/leaderboard";
import {adminAnalytics} from "./api/adminAnalytics";
import {
  reciteHandler,
  transcribeHandler,
  findSherHandler,
  baitBaziHandler,
} from "./api/voice";
import {getSherHandler, dailySherHandler} from "./api/sher";

admin.initializeApp();

// preferRest: avoids gRPC NOT_FOUND issues in some regions.
// ignoreUndefinedProperties: optional fields (e.g. ocrConfidence) were sent
// as `undefined`, which made Firestore throw and /save return 500.
initializeFirestore(admin.app(), {preferRest: true})
  .settings({ignoreUndefinedProperties: true});

setGlobalOptions({region: "us-central1", maxInstances: 10});

const app = express();

// Works both via cloudfunctions.net/api/<route> (prefix already stripped)
// and via the Hosting rewrite /api/** (prefix still present).
app.use((req, _res, next) => {
  if (req.url === "/api" || req.url.startsWith("/api/")) {
    req.url = req.url.slice(4) || "/";
  }
  next();
});

// Allowed web origins: comma-separated ALLOWED_ORIGINS in functions/.env.
// Empty = allow all (handy for local dev and the hackathon demo).
const allowed = (process.env.ALLOWED_ORIGINS || "")
  .split(",").map((o) => o.trim()).filter(Boolean);
app.use(cors({
  origin: allowed.length ? allowed : true,
}));
app.use(express.json({limit: "12mb"}));

// Every route can see req.user when a token is sent.
app.use(optionalAuth);

// Rate limits for endpoints that cost money (Vision / Gemini / TTS).
const aiHeavy = rateLimit("ai-heavy", 12); // per minute
const aiLight = rateLimit("ai-light", 40);
const voice = rateLimit("voice", 15);

// --- Scan + explanation ---
app.post("/ocr", aiHeavy, ocrHandler);
app.post("/tashreeh", aiHeavy, tashreehHandler);
app.post("/dictionary", requireAuth, aiLight, dictionaryHandler);

// --- History ---
app.get("/history", requireAuth, historyHandler);
app.get("/history/:scanId", requireAuth, getScanHandler);
app.post("/save", requireAuth, aiLight, saveHandler);

// --- Vocabulary (single SM-2 deck) ---
app.get("/vocabulary", requireAuth, getVocabularyHandler);
app.post("/vocabulary", requireAuth, saveVocabularyHandler);
app.patch("/vocabulary/:id/review", requireAuth, reviewVocabularyHandler);
app.post("/word/save", requireAuth, saveWordHandler); // legacy alias
app.put("/word/review", requireAuth, wordReviewHandler); // legacy alias

// --- Discovery ---
app.post("/search", aiLight, semanticSearch);
app.post("/search/keyword", keywordSearch);
app.post("/search/mood", aiLight, moodSearch);
app.post("/search/era", eraSearch);
app.post("/similar", similarSher);
app.get("/sher/:id", getSherHandler);
app.get("/feed/daily", dailySherHandler);

// --- Poetry AI ---
app.post("/poetry-chat", aiLight, poetryChat);
app.post("/poetry-complete", aiLight, poetryComplete);

// --- Voice: Ustad coach, voice search, bait-bazi ---
app.post("/tts", aiLight, ttsHandler);
app.post("/voice/recite", requireAuth, voice, reciteHandler);
app.post("/voice/transcribe", voice, transcribeHandler);
app.post("/voice/find-sher", voice, findSherHandler);
app.post("/voice/baitbazi", voice, baitBaziHandler);
app.post("/upload-recitation", requireAuth, voice, uploadRecitation);
app.get("/official-recitations/:sherId", getOfficialRecitations);

// --- Community + admin ---
app.get("/leaderboard", leaderboard);
app.get("/admin-analytics", requireAuth, requireAdmin, adminAnalytics);

app.get("/health", (_req, res) => {
  res.json({ok: true, gemini: !!process.env.GEMINI_API_KEY});
});

/* eslint-disable @typescript-eslint/no-unused-vars */
app.use((
  err: unknown,
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction
) => {
  console.error(err);
  const e = err as {type?: string};
  if (e?.type === "entity.too.large") {
    res.status(413).json({error: "Upload too large"});
    return;
  }
  res.status(500).json({error: "Internal Server Error"});
});
/* eslint-enable @typescript-eslint/no-unused-vars */

// OCR + 3-level tashreeh + transliteration can take >60s on a cold start,
// and audio evaluation needs headroom, so raise timeout and memory.
export const api = onRequest(
  {timeoutSeconds: 180, memory: "1GiB", concurrency: 40},
  app,
);
