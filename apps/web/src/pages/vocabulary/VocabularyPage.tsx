import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchVocabulary,
  reviewVocabulary,
  type VocabularyItem,
} from "../../services/functions.service";

function formatTimestamp(value: unknown): string {
  if (value == null) return "—";
  const o = value as { seconds?: number; nanoseconds?: number };
  if (typeof o?.seconds === "number") {
    return new Date(o.seconds * 1000).toLocaleString();
  }
  if (value instanceof Date) return value.toLocaleString();
  return "—";
}

export default function VocabularyPage() {
  const navigate = useNavigate();
  const [words, setWords] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

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
    setReviewError(null);
    setReviewingId(wordId);
    try {
      const { strength } = await reviewVocabulary(wordId, quality);
      setWords((prev) =>
        prev.map((w) =>
          w.id === wordId ? { ...w, strength, lastReviewed: new Date() } : w
        )
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Review failed";
      setReviewError(message);
      console.error("Review failed:", err);
    } finally {
      setReviewingId(null);
    }
  }

  if (loading) {
    return (
      <div
        className="min-h-screen bg-cover bg-no-repeat bg-center"
        style={{backgroundImage: "url('/images/background-pattern-soft.png')"}}
      >
        <div className="max-w-4xl mx-auto p-6">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mb-4 inline-flex items-center gap-2 text-sm text-[#c26a3b] hover:text-[#a9552a]"
          >
            <span className="text-lg">←</span>
            <span>Back to Home</span>
          </button>
          <h2 className="text-3xl mb-4 text-[#3b2419]">My Vocabulary</h2>
          <p className="text-[#94725a]">Loading…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen bg-cover bg-no-repeat bg-center"
        style={{backgroundImage: "url('/images/background-pattern-soft.png')"}}
      >
        <div className="max-w-4xl mx-auto p-6">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mb-4 inline-flex items-center gap-2 text-sm text-[#c26a3b] hover:text-[#a9552a]"
          >
            <span className="text-lg">←</span>
            <span>Back to Home</span>
          </button>
          <h2 className="text-3xl mb-4 text-[#3b2419]">My Vocabulary</h2>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-no-repeat bg-center"
      style={{backgroundImage: "url('/images/background-pattern-soft.png')"}}
    >
      <div className="max-w-4xl mx-auto p-6">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-4 inline-flex items-center gap-2 text-sm text-[#c26a3b] hover:text-[#a9552a]"
        >
          <span className="text-lg">←</span>
          <span>Back to Home</span>
        </button>
        <h2 className="text-3xl mb-4 text-[#3b2419]">My Vocabulary</h2>
        <p className="text-sm text-[#94725a] mb-6">
          Tap a word on the Scan page to look it up and save it here. Rate how well you knew it (0–5) to update strength (spaced repetition).
        </p>

      {reviewError && (
        <p className="mb-4 p-3 rounded-lg bg-red-100 border border-red-300 text-red-700 text-sm">
          {reviewError}
        </p>
      )}

        {words.length === 0 ? (
          <p className="text-[#94725a]">No words saved yet. Scan poetry and tap words to add them.</p>
        ) : (
          <ul className="space-y-3">
            {words.map((w) => (
              <li
                key={w.id}
                className="p-4 rounded-xl border border-[#e2c9ad] flex flex-col gap-2 bg-[#fff7ef]"
              >
                <div className="text-xl font-medium text-[#3b2419]">{w.word}</div>
                <div className="text-[#5a3a28] text-sm">
                  {w.meaning && w.meaning !== "Loading…"
                    ? w.meaning
                    : "— Definition not loaded. Add again from Scan by tapping the word after the definition loads."}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-[#94725a]">Strength: {w.strength}</span>
                  <span className="text-[#b08a6a]">·</span>
                  <span className="text-xs text-[#94725a]">Last reviewed: {formatTimestamp(w.lastReviewed)}</span>
                  <span className="text-[#b08a6a]">·</span>
                  <span className="text-xs text-[#94725a]">Rate recall:</span>
                  {[0, 1, 2, 3, 4, 5].map((q) => (
                    <button
                      key={q}
                      type="button"
                      disabled={reviewingId === w.id}
                      onClick={() => handleReview(w.id, q)}
                      className="px-2 py-0.5 text-xs rounded bg-[#f6e2cf] border border-[#e2c9ad] text-[#3b2419] hover:bg-[#e2c9ad] disabled:opacity-50"
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
    </div>
  );
}
