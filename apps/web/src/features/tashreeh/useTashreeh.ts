import { useState } from "react";
import { fetchTashreeh } from "./tashreeh.service";

export function useTashreeh() {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function explain(text: string) {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching tashreeh for text:", text);
      const result = await fetchTashreeh(text);
      console.log("Tashreeh result:", result);
      setExplanation(result);
    } catch (e: any) {
      console.error("Tashreeh error:", e);
      setError(e.message || "Failed to get explanation");
    } finally {
      setLoading(false);
    }
  }

  return { explanation, loading, error, explain };
}
