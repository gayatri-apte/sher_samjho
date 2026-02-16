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

admin.initializeApp();

// REST transport can resolve 5 NOT_FOUND when gRPC has region issues
initializeFirestore(admin.app(), {preferRest: true});

const app = express();

app.use(cors({origin: true}));
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

