import { useState, useEffect } from "react";
import {
  fetchVocabulary,
  reviewVocabulary,
  type VocabularyItem,
} from "../../services/functions.service";

export default function VocabularyPage() {
  const [words, setWords] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchVocabulary()
      .then((list) => {
        if (!cancelled) setWords(list);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load vocabulary");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleReview(wordId: string, quality: number) {
    setReviewingId(wordId);
    try {
      const { strength } = await reviewVocabulary(wordId, quality);
      setWords((prev) =>
        prev.map((w) =>
          w.id === wordId ? { ...w, strength, lastReviewed: new Date() } : w
        )
      );
    } catch (err) {
      console.error("Review failed:", err);
    } finally {
      setReviewingId(null);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-3xl mb-4">My Vocabulary</h2>
        <p className="text-neutral-400">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-3xl mb-4">My Vocabulary</h2>
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-3xl mb-4">My Vocabulary</h2>
      <p className="text-sm text-neutral-400 mb-6">
        Tap a word on the Scan page to look it up and save it here. Rate how well you knew it to update strength (spaced repetition).
      </p>

      {words.length === 0 ? (
        <p className="text-neutral-500">No words saved yet. Scan poetry and tap words to add them.</p>
      ) : (
        <ul className="space-y-0">
          {words.map((w) => (
            <li
              key={w.id}
              className="p-4 border-b border-neutral-700 flex flex-col gap-2"
            >
              <div className="text-xl font-medium text-neutral-100">{w.word}</div>
              <div className="text-neutral-400 text-sm">
                {w.meaning && w.meaning !== "Loading…"
                  ? w.meaning
                  : "— Definition not loaded. Add again from Scan by tapping the word after the definition loads."}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-neutral-500">Strength: {w.strength}</span>
                <span className="text-neutral-600">·</span>
                <span className="text-xs text-neutral-500">Rate recall:</span>
                {[0, 1, 2, 3, 4, 5].map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={reviewingId === w.id}
                    onClick={() => handleReview(w.id, q)}
                    className="px-2 py-0.5 text-xs rounded bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50"
                    title={q < 3 ? "Forgot / wrong" : "Knew it"}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
