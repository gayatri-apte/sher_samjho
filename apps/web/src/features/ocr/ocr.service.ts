import { api } from "../../config/api";
import { auth } from "../../services/firebase";

export type TashreehLevels = {
  beginner: string;
  intermediate: string;
  scholar: string;
};

export type OCRResult = {
  rawUrdu: string;
  script?: "urdu" | "devanagari";
  devanagariText: string;
  tashreeh: TashreehLevels | string;
  romanText?: string;
  textHash: string;
  hitCount?: number;
  createdAt?: unknown;
  confidence?: number;
  aiGenerated?: boolean;
};

export async function sendImageForOCR(file: File): Promise<OCRResult> {
  const base64 = await fileToBase64(file);
  const token = await auth.currentUser?.getIdToken();

  const res = await fetch(api.ocr,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ image: base64 }),
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage =
      errorData.message ||
      errorData.error ||
      `HTTP ${res.status}: ${res.statusText}`;
    throw new Error(errorMessage);
  }

  const data = await res.json();
  return data as OCRResult;
}

/**
 * Downscales big phone photos (often 4–12 MB) to ≤1600px JPEG before upload.
 * Faster uploads, stays under the API body limit, and OCR quality is the same.
 */
async function fileToBase64(file: File): Promise<string> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    return dataUrl.split(",")[1];
  } catch {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
}
