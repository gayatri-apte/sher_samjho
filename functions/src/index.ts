import * as functions from "firebase-functions";
import express from "express";
import {ocrHandler} from "./api/ocr";

const app = express();
app.use(express.json({limit: "10mb"}));

app.post("/ocr", ocrHandler);

export const api = functions.https.onRequest(app);
