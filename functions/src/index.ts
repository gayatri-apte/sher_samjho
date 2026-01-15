import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";
import {ocrHandler} from "./api/ocr";

admin.initializeApp();

const app = express();

app.use(cors({origin: true}));
app.use(express.json({limit: "10mb"}));

app.post("/ocr", ocrHandler);

export const api = functions.https.onRequest(app);
