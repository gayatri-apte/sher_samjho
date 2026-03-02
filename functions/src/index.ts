import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {initializeFirestore} from "firebase-admin/firestore";
import express from "express";
import cors from "cors";
import {requireAuth} from "./guards/auth.guard";
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

admin.initializeApp();

// REST transport can resolve 5 NOT_FOUND when gRPC has region issues
initializeFirestore(admin.app(), {preferRest: true});

const app = express();

const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const envOrigins = process.env.FRONTEND_ORIGINS ?
  process.env.FRONTEND_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean) :
  [];

const allowedOrigins = [...defaultAllowedOrigins, ...envOrigins];

app.use(cors({
  origin: allowedOrigins,
}));
app.use(express.json({limit: "10mb"}));

app.post("/ocr", ocrHandler);
app.post("/tashreeh", tashreehHandler);
app.get("/history", requireAuth, historyHandler);
app.get("/history/:scanId", requireAuth, getScanHandler);
app.post("/save", requireAuth, saveHandler);
app.post("/dictionary", requireAuth, dictionaryHandler);
app.get("/vocabulary", requireAuth, getVocabularyHandler);
app.post("/vocabulary", requireAuth, saveVocabularyHandler);
app.patch("/vocabulary/:id/review", requireAuth, reviewVocabularyHandler);
app.post("/word/save", requireAuth, saveWordHandler);
app.put("/word/review", requireAuth, wordReviewHandler);
app.post("/search", semanticSearch);
app.post("/search/keyword", keywordSearch);
app.post("/search/mood", moodSearch);
app.post("/similar", similarSher);
app.post("/search/era", eraSearch);
app.post("/poetry-chat", poetryChat);
app.post("/poetry-complete", poetryComplete);
app.post("/tts", ttsHandler);
app.post("/upload-recitation", requireAuth, uploadRecitation);
app.get("/official-recitations/:sherId", getOfficialRecitations);
app.get("/leaderboard", leaderboard);
app.get("/admin-analytics", adminAnalytics);

/* eslint-disable @typescript-eslint/no-unused-vars */
app.use((
  err: unknown,
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction
) => {
  console.error(err);
  res.status(500).json({error: "Internal Server Error"});
});
/* eslint-enable @typescript-eslint/no-unused-vars */


export const api = functions.https.onRequest(app);

