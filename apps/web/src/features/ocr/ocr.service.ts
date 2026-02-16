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
    throw new Error(`OCR request failed: ${errorMessage}`);
  }

  const data = await res.json();
  return data as OCRResult;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve((reader.result as string).split(",")[1]);
    reader.readAsDataURL(file);
  });
}
