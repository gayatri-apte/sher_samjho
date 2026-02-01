import vision, {ImageAnnotatorClient} from "@google-cloud/vision";
import * as admin from "firebase-admin";

// Get the project ID from Firebase Admin (initialized in index.ts)
// This ensures we use the correct project ID that matches Firebase Functions
const getProjectId = (): string => {
  // Try to get from Firebase Admin first
  try {
    const app = admin.app();
    if (app?.options?.projectId) {
      return app.options.projectId;
    }
  } catch {
    // Admin not initialized yet or no project ID
  }

  // Fallback to environment variables or default
  return process.env.GCLOUD_PROJECT ||
         process.env.GCP_PROJECT ||
         process.env.GOOGLE_CLOUD_PROJECT ||
         "internship-8cf33";
};

let client: ImageAnnotatorClient | null = null;

/**
 * Returns a lazily-initialized Vision API client.
 * Lazily initialized so deploy/analyze doesn't fail on import.
 *
 * @return {ImageAnnotatorClient} Vision ImageAnnotatorClient
 */
function getVisionClient(): ImageAnnotatorClient {
  if (!client) {
    client = new vision.ImageAnnotatorClient({
      projectId: getProjectId(),
    });
  }
  return client;
}

/**
 * Extracts text from an image buffer using Google Vision API
 *
 * @param {Buffer} buffer Image buffer
 * @return {Promise<string>} Extracted text
 */
export async function extractTextFromImage(buffer: Buffer): Promise<string> {
  try {
    const client = getVisionClient();
    const [result] = await client.textDetection({
      image: {content: buffer},
    });

    const detections = result.textAnnotations;
    if (!detections || detections.length === 0) {
      return "";
    }

    return detections[0].description || "";
  } catch (error) {
    console.error("Vision API error:", error);
    const errorMsg =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Vision API failed: ${errorMsg}`);
  }
}

/**
 * Detects text from an image using Google Vision API
 *
 * @param {string} imagePath Path or URL of the image
 * @return {Promise<string>} Extracted text
 */
export async function detectText(imagePath: string): Promise<string> {
  const client = getVisionClient();
  const [result] = await client.textDetection(imagePath);

  const detections = result.textAnnotations;
  return detections?.[0]?.description || "";
}
