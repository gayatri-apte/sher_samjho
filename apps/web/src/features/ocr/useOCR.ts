import { useState } from "react";
import { auth } from "../../services/firebase";
import { sendImageForOCR } from "./ocr.service";
import type { OCRResult } from "./ocr.service";

const GUEST_SCAN_LIMIT = 5;
const GUEST_SCANS_KEY = "guest_scans";

export function useOCR() {
  const [result, setResult] = useState<OCRResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze(file: File) {
    try {
      setLoading(true);
      setError(null);

      const user = auth.currentUser;
      const isGuest = !user || user.isAnonymous;
      if (isGuest) {
        const scans = Number(localStorage.getItem(GUEST_SCANS_KEY) || 0);
        if (scans >= GUEST_SCAN_LIMIT) {
          throw new Error("Login required after 5 scans");
        }
        localStorage.setItem(GUEST_SCANS_KEY, String(scans + 1));
      }

      const data = await sendImageForOCR(file);
      setResult(data);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "OCR failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return {
    result,
    text: result?.devanagariText ?? null,
    devanagariText: result?.devanagariText ?? null,
    romanText: result?.romanText ?? null,
    tashreeh: result?.tashreeh ?? null,
    textHash: result?.textHash ?? null,
    loading,
    error,
    analyze,
  };
}
