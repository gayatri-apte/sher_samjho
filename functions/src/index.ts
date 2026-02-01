import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {initializeFirestore} from "firebase-admin/firestore";
import express from "express";
import cors from "cors";
import {requireAuth} from "./guards/auth.guard";
import {ocrHandler} from "./api/ocr";
import {tashreehHandler} from "./api/tashreeh";
import {historyHandler} from "./api/history";
import {saveHandler} from "./api/save";

admin.initializeApp();

// REST transport can resolve 5 NOT_FOUND when gRPC has region issues
initializeFirestore(admin.app(), {preferRest: true});

const app = express();

app.use(cors({origin: true}));
app.use(express.json({limit: "10mb"}));

app.post("/ocr", ocrHandler);
app.post("/tashreeh", tashreehHandler);
app.get("/history", requireAuth, historyHandler);
app.post("/save", requireAuth, saveHandler);

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

