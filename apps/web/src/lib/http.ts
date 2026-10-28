import { auth } from "../services/firebase";

/**
 * fetch + JSON with the user's Firebase token attached when signed in.
 * Throws an Error with the server's message on non-2xx.
 */
export async function apiJSON<T>(
  url: string,
  opts: { method?: string; body?: unknown; requireAuth?: boolean } = {},
): Promise<T> {
  const user = auth.currentUser;
  if (opts.requireAuth && !user) {
    throw new Error("Please sign in (guest is fine) to use this.");
  }
  const token = user ? await user.getIdToken() : null;

  const res = await fetch(url, {
    method: opts.method ?? (opts.body ? "POST" : "GET"),
    headers: {
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      (data && (data.error || data.message || data.detail)) ||
      (res.status === 429
        ? "Too many requests — please wait a moment."
        : `Request failed (${res.status})`);
    throw new Error(String(msg));
  }
  return data as T;
}

export type Sher = {
  id: string;
  devanagariText?: string;
  rawUrdu?: string;
  romanText?: string;
  tashreeh?: unknown;
  poet?: string;
  era?: string;
  themes?: string[];
  score?: number;
  ocrConfidence?: number;
  attributionConfidence?: number;
};

/** Picks a readable explanation from string | {beginner,...}. */
export function tashreehText(t: unknown, level = "beginner"): string {
  if (!t) return "";
  if (typeof t === "string") return t;
  const o = t as Record<string, string>;
  return o[level] || o.beginner || o.intermediate || o.scholar || "";
}

/** Navigation state shape used by Reader / Poetry AI / Ustad. */
export function sherState(s: Sher) {
  return {
    text: s.devanagariText ?? "",
    poet: s.poet ?? "",
    explanation: tashreehText(s.tashreeh),
    ocrConfidence: s.ocrConfidence,
    attributionConfidence: s.attributionConfidence,
    cacheHash: s.id,
  };
}
