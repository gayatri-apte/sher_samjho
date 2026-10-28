import type {DocumentData} from "firebase-admin/firestore";

/**
 * Cosine similarity between two vectors (0 when either is empty/mismatched).
 * @param {number[]} a - First vector
 * @param {number[]} b - Second vector
 * @return {number} Similarity in [-1, 1]
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0;
  let ma = 0;
  let mb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    ma += a[i] * a[i];
    mb += b[i] * b[i];
  }
  if (!ma || !mb) return 0;
  return dot / (Math.sqrt(ma) * Math.sqrt(mb));
}

export type PublicSher = {
  id: string;
  devanagariText?: string;
  rawUrdu?: string;
  romanText?: string;
  tashreeh?: unknown;
  poet?: string;
  era?: string;
  movement?: string;
  themes?: string[];
  hitCount?: number;
  ocrConfidence?: number;
  attributionConfidence?: number;
  score?: number;
};

/**
 * Strips heavy/private fields (3k-float embeddings, keyword arrays) before a
 * cached sher is sent to the browser.
 * @param {string} id - Document id (text hash)
 * @param {DocumentData} data - Firestore data
 * @param {number} score - Optional similarity score
 * @return {PublicSher} Lightweight sher object
 */
export function toPublicSher(
  id: string,
  data: DocumentData,
  score?: number,
): PublicSher {
  return {
    id,
    devanagariText: data.devanagariText ?? data.text,
    rawUrdu: data.rawUrdu,
    romanText: data.romanText,
    tashreeh: data.tashreeh,
    poet: data.poet,
    era: data.era,
    movement: data.movement,
    themes: data.themes,
    hitCount: data.hitCount,
    ocrConfidence: data.ocrConfidence,
    attributionConfidence: data.attributionConfidence,
    ...(typeof score === "number" ? {score: Number(score.toFixed(4))} : {}),
  };
}
