import {api} from "../config/api";
import {waitForAuth} from "./auth.service";

export async function callHistory() {
  const user = await waitForAuth();
  const token = await user.getIdToken(true);

  const res = await fetch(
    api.history,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const errorJson = await res
      .json()
      .catch(() => null) as Record<string, unknown> | null;
    const errorText = errorJson ? null : await res.text().catch(() => "");
    const message =
      (errorJson?.detail as string) ||
      (errorJson?.error as string) ||
      (errorJson?.message as string) ||
      (errorText ? errorText.slice(0, 200) : null) ||
      `HTTP ${res.status}`;
    throw new Error(message);
  }

  return res.json();
}

// Thin wrapper for UI-specific history fetching
export async function fetchHistory() {
  return callHistory();
}

// Fetch a single scan by id via backend (avoids Firestore client rules)
export async function fetchScanById(id: string) {
  const user = await waitForAuth();
  const token = await user.getIdToken(true);

  const url = `${api.history}/${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorJson = await res
      .json()
      .catch(() => null) as Record<string, unknown> | null;
    const message =
      (errorJson?.error as string) ||
      (errorJson?.message as string) ||
      `Failed to load scan: ${res.status}`;
    throw new Error(message);
  }

  return res.json();
}

export async function saveHistory(data: {
  cacheHash: string;
  text: string;
  explanation: string;
  devanagariText?: string;
  tashreeh?: string;
  poet?: string;
  ocrConfidence?: number;
  attributionConfidence?: number;
}) {
  const user = await waitForAuth();
  const token = await user.getIdToken(true);

  const res = await fetch(api.save, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorJson = await res
      .json()
      .catch(() => null) as Record<string, unknown> | null;
    const errorText = errorJson ? null : await res.text().catch(() => "");
    const message =
      (errorJson?.detail as string) ||
      (errorJson?.error as string) ||
      (errorJson?.message as string) ||
      (errorText ? errorText.slice(0, 200) : null) ||
      `Save failed: ${res.status}`;
    throw new Error(message);
  }

  return res.json();
}

export async function lookupDictionary(word: string) {
  const user = await waitForAuth();
  const token = await user.getIdToken(true);

  const res = await fetch(api.dictionary, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ word }),
  });

  if (!res.ok) {
    const errorJson = await res
      .json()
      .catch(() => null) as Record<string, unknown> | null;
    const message =
      (errorJson?.error as string) ||
      (errorJson?.message as string) ||
      `Dictionary lookup failed: ${res.status}`;
    throw new Error(message);
  }

  return res.json() as Promise<{ meaning: string }>;
}

export async function saveVocabulary(word: string, meaning: string) {
  const user = await waitForAuth();
  const token = await user.getIdToken(true);

  const res = await fetch(api.vocabulary, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ word, meaning }),
  });

  if (!res.ok) {
    const errorJson = await res
      .json()
      .catch(() => null) as Record<string, unknown> | null;
    const message =
      (errorJson?.error as string) ||
      (errorJson?.message as string) ||
      `Save to vocabulary failed: ${res.status}`;
    throw new Error(message);
  }

  return res.json() as Promise<{ success: boolean }>;
}

export type VocabularyItem = {
  id: string;
  word: string;
  meaning: string;
  strength: number;
  lastReviewed: unknown;
  addedAt: unknown;
};

export async function fetchVocabulary(): Promise<VocabularyItem[]> {
  const user = await waitForAuth();
  const token = await user.getIdToken(true);

  const res = await fetch(api.vocabulary, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorJson = await res
      .json()
      .catch(() => null) as Record<string, unknown> | null;
    const message =
      (errorJson?.error as string) ||
      (errorJson?.message as string) ||
      `Failed to load vocabulary: ${res.status}`;
    throw new Error(message);
  }

  return res.json();
}

export async function saveWord(word: string, meaning: string) {
  const user = await waitForAuth();
  const token = await user.getIdToken(true);

  const res = await fetch(api.wordSave, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ word, meaning }),
  });

  if (!res.ok) {
    const errorJson = await res
      .json()
      .catch(() => null) as Record<string, unknown> | null;
    const message =
      (errorJson?.error as string) ||
      (errorJson?.message as string) ||
      `Save word failed: ${res.status}`;
    throw new Error(message);
  }

  return res.json() as Promise<{ success: boolean; id: string }>;
}

export async function reviewWord(wordId: string, rating: number) {
  const user = await waitForAuth();
  const token = await user.getIdToken(true);

  const res = await fetch(api.wordReview, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ wordId, rating }),
  });

  if (!res.ok) {
    const errorJson = await res
      .json()
      .catch(() => null) as Record<string, unknown> | null;
    const message =
      (errorJson?.error as string) ||
      (errorJson?.message as string) ||
      `Review failed: ${res.status}`;
    throw new Error(message);
  }

  return res.json() as Promise<{ success: boolean; strength: number }>;
}

export async function reviewVocabulary(wordId: string, quality: number) {
  const user = await waitForAuth();
  const token = await user.getIdToken(true);

  const url = `${api.vocabulary}/${encodeURIComponent(wordId)}/review`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ quality }),
  });

  if (!res.ok) {
    const errorJson = await res
      .json()
      .catch(() => null) as Record<string, unknown> | null;
    const message =
      (errorJson?.error as string) ||
      (errorJson?.message as string) ||
      `Review failed: ${res.status}`;
    throw new Error(message);
  }

  return res.json() as Promise<{ success: boolean; strength: number }>;
}
