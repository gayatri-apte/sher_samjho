import {getFirestore, type DocumentData} from "firebase-admin/firestore";
import {cosineSimilarity, toPublicSher, type PublicSher} from "./vectors";

type Entry = {id: string; data: DocumentData; embedding?: number[]};

let cached: {at: number; entries: Entry[]} | null = null;
const TTL_MS = 2 * 60 * 1000;

/**
 * Loads the whole global_poetry_cache once per 2 minutes per instance.
 * All vector searches reuse it instead of re-reading every document on
 * every request (which is slow and costs a Firestore read per doc).
 * @param {boolean} fresh - Force a reload
 * @return {Promise<Entry[]>} Corpus entries
 */
export async function loadCorpus(fresh = false): Promise<Entry[]> {
  if (!fresh && cached && Date.now() - cached.at < TTL_MS) {
    return cached.entries;
  }
  const snap = await getFirestore().collection("global_poetry_cache").get();
  const entries = snap.docs.map((d) => {
    const data = d.data();
    const emb = data.embedding as number[] | undefined;
    return {id: d.id, data, embedding: Array.isArray(emb) ? emb : undefined};
  });
  cached = {at: Date.now(), entries};
  return entries;
}

/** Clears the in-memory corpus (call after writes). */
export function invalidateCorpus() {
  cached = null;
}

/**
 * Ranks corpus entries by cosine similarity to a query vector.
 * @param {number[]} vector - Query embedding
 * @param {number} k - Number of results
 * @param {string} excludeId - Optional id to exclude
 * @param {number} minScore - Drop weak matches below this score
 * @return {Promise<PublicSher[]>} Top matches
 */
export async function nearest(
  vector: number[],
  k = 5,
  excludeId?: string,
  minScore = 0,
): Promise<PublicSher[]> {
  const entries = await loadCorpus();
  return entries
    .filter((e) => e.embedding && e.id !== excludeId)
    .map((e) => ({e, score: cosineSimilarity(vector, e.embedding as number[])}))
    .filter((x) => x.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((x) => toPublicSher(x.e.id, x.e.data, x.score));
}
