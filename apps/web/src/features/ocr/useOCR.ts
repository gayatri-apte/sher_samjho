import { useState } from "react";
import { sendImageForOCR } from "./ocr.service";
import { normalizeUrdu } from "@shared/language/urdu-normalization";

export function useOCR() {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze(file: File) {
    try {
      setLoading(true);
      setError(null);

      const raw = await sendImageForOCR(file);
      const clean = normalizeUrdu(raw);

      setText(clean);
    } catch (e: any) {
      setError(e.message || "OCR failed");
    } finally {
      setLoading(false);
    }
  }

  return { text, loading, error, analyze };
}
