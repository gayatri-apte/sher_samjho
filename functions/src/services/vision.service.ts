import vision from "@google-cloud/vision";

const client = new vision.ImageAnnotatorClient();

/**
 * Extracts text from an image buffer using Google Vision API
 *
 * @param {Buffer} buffer Image buffer
 * @return {Promise<string>} Extracted text
 */
export async function extractTextFromImage(buffer: Buffer): Promise<string> {
  const [result] = await client.textDetection({
    image: {content: buffer},
  });

  const detections = result.textAnnotations;
  if (!detections || detections.length === 0) {
    return "";
  }

  return detections[0].description || "";
}

/**
 * Detects text from an image using Google Vision API
 *
 * @param {string} imagePath Path or URL of the image
 * @return {Promise<string>} Extracted text
 */
export async function detectText(imagePath: string): Promise<string> {
  const [result] = await client.textDetection(imagePath);

  const detections = result.textAnnotations;
  return detections?.[0]?.description || "";
}
