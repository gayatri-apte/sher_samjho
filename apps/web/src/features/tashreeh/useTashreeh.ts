import { useState } from "react";
import { fetchTashreeh } from "./tashreeh.service";
import type { TashreehLevels } from "./tashreeh.service";

export type TashreehLevel = "beginner" | "intermediate" | "scholar";

export function useTashreeh() {
  const [levels, setLevels] = useState<TashreehLevels | null>(null);
  const [level, setLevel] = useState<TashreehLevel>("beginner");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const explanation =
    levels == null ? null : levels[level] ?? levels.beginner ?? null;

  async function explain(text: string) {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchTashreeh(text);
      setLevels(result);
      return result;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to get explanation";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return {
    levels,
    level,
    setLevel,
    explanation,
    loading,
    error,
    explain,
  };
}
