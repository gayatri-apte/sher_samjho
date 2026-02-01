import {Request, Response} from "express";
import {extractTextFromImage} from "../services/vision.service";


/**
 * HTTP endpoint for OCR using Google Vision API
 *
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @return {Promise<void>}
 */
export async function ocrHandler(req: Request, res: Response): Promise<void> {
  try {
    if (!req.body?.image) {
      res.status(400).json({error: "Image missing"});
      return;
    }

    const buffer = Buffer.from(req.body.image, "base64");
    const text = await extractTextFromImage(buffer);

    res.json({text});
  } catch (error) {
    console.error("OCR error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    const errorDetails = error instanceof Error ? error.stack : String(error);
    console.error("OCR error details:", errorDetails);
    res.status(500).json({
      error: "OCR failed",
      message: errorMessage,
      details: process.env.NODE_ENV === "development" ?
        errorDetails : undefined,
    });
  }
}
