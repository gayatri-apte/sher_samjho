import { api } from "../config/api";
import { apiJSON } from "../lib/http";

/*
 * Thin typed wrappers over the backend. All go through apiJSON, which waits
 * for the Firebase session, attaches the token, times out instead of
 * hanging, and surfaces the server's real error message.
 */

export function fetchHistory() {
  return apiJSON<unknown[]>(api.history, { requireAuth: true });
}
export const callHistory = fetchHistory;

export function fetchScanById(id: string) {
  return apiJSON<Record<string, unknown>>(`${api.history}/${encodeURIComponent(id)}`, {
    requireAuth: true,
  });
}

export function saveHistory(data: {
  cacheHash: string;
  text: string;
  explanation: string;
  devanagariText?: string;
  tashreeh?: string;
  poet?: string;
  ocrConfidence?: number;
  attributionConfidence?: number;
}) {
  return apiJSON<{ success: boolean }>(api.save, { body: data, requireAuth: true });
}

export function lookupDictionary(word: string) {
  return apiJSON<{ meaning: string }>(api.dictionary, { body: { word }, requireAuth: true });
}

export function saveVocabulary(word: string, meaning: string) {
  return apiJSON<{ success: boolean }>(api.vocabulary, {
    body: { word, meaning },
    requireAuth: true,
  });
}

export type VocabularyItem = {
  id: string;
  word: string;
  meaning: string;
  roman?: string;
  tip?: string;
  source?: "dictionary" | "ustad" | "manual";
  strength: number;
  interval: number;
  repetitions: number;
  easiness?: number;
  dueAt: number | null;
  isDue: boolean;
  mistakes: number;
  lastReviewed: unknown;
  addedAt: unknown;
};

export function fetchVocabulary() {
  return apiJSON<VocabularyItem[]>(api.vocabulary, { requireAuth: true });
}

export const saveWord = saveVocabulary;

export function reviewVocabulary(wordId: string, quality: number) {
  return apiJSON<{ success: boolean; strength: number; interval: number; repetitions?: number; easiness?: number; dueAt: number }>(
    `${api.vocabulary}/${encodeURIComponent(wordId)}/review`,
    { method: "PATCH", body: { quality }, requireAuth: true },
  );
}
export const reviewWord = reviewVocabulary;
