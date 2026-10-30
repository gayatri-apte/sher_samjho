import { auth } from "../services/firebase";

/**
 * fetch + JSON with the user's Firebase token attached when signed in.
 * Throws an Error with the server's message on non-2xx.
 */
export async function apiJSON<T>(
  url: string,
  opts: { method?: string; body?: unknown; requireAuth?: boolean; timeoutMs?: number } = {},
): Promise<T> {
  await Promise.race([auth.authStateReady(), new Promise((r) => setTimeout(r, 5000))]);
  const user = auth.currentUser;
  if (opts.requireAuth && !user) {
    throw new Error("Please sign in (guest is fine) to use this.");
  }
  const token = user ? await user.getIdToken() : null;

  // Never leave the UI spinning forever (cold starts can take ~20 s).
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 120_000);
  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method ?? (opts.body ? "POST" : "GET"),
      headers: {
        ...(opts.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: ctrl.signal,
    });
  } catch (e) {
    throw new Error(
      (e as Error)?.name === "AbortError"
        ? "The server took too long to answer. Please try again."
        : "Network error — check your connection and try again.",
    );
  } finally {
    clearTimeout(timer);
  }

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
