import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Mic2, BookMarked } from "lucide-react";
import Page, { Card, ErrorNote } from "../../components/ui/Page";
import SpeakButton from "../../components/voice/SpeakButton";
import {
  fetchVocabulary,
  reviewVocabulary,
  type VocabularyItem,
} from "../../services/functions.service";

const GRADES = [
  { q: 1, label: "Again", hint: "forgot", cls: "bg-[#fdecea] text-[#8a2a1a] border-[#e9b4a4]" },
  { q: 3, label: "Hard", hint: "", cls: "bg-[#fdf3e4] text-[#8a5a12] border-[#ecd0a0]" },
  { q: 4, label: "Good", hint: "", cls: "bg-[#e6f2e4] text-[#24502a] border-[#b7d7b0]" },
  { q: 5, label: "Easy", hint: "", cls: "bg-[#e2eef6] text-[#1f4a6b] border-[#b3cfe3]" },
];

function dueLabel(w: VocabularyItem) {
  if (w.isDue) return "due now";
  if (!w.dueAt) return "";
  const days = Math.ceil((w.dueAt - Date.now()) / 86400000);
  return days <= 1 ? "due tomorrow" : `due in ${days} days`;
}

export default function VocabularyPage() {
  const [words, setWords] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchVocabulary()
      .then(setWords)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load vocabulary"))
      .finally(() => setLoading(false));
  }, []);

  // Session queue: due words, and "Again" cards go to the back so they
  // come round again before the session ends (as in Anki / SuperMemo).
  const [queue, setQueue] = useState<string[]>([]);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const due = useMemo(() => words.filter((w) => w.isDue), [words]);
  const card = words.find((w) => w.id === queue[0]);

  function startReview() {
    setQueue(due.map((w) => w.id));
    setReviewMode(true);
    setRevealed(false);
    setLastResult(null);
  }

  async function grade(id: string, q: number) {
    setBusy(true);
    try {
      const r = await reviewVocabulary(id, q);
      const forgot = q < 3;
      setWords((prev) =>
        prev.map((w) =>
          w.id === id
            ? { ...w, strength: r.strength, interval: r.interval, repetitions: r.repetitions ?? w.repetitions, dueAt: r.dueAt, isDue: forgot }
            : w,
        ),
      );
      setQueue((qu) => (forgot ? [...qu.slice(1), id] : qu.slice(1)));
      const word = words.find((w) => w.id === id)?.word ?? "";
      setLastResult(
        forgot
          ? `${word}: we'll show it again in this session`
          : `${word}: next review in ${r.interval} day${r.interval === 1 ? "" : "s"}`,
      );
      setRevealed(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review failed");
    } finally {
      setBusy(false);
    }
  }

  /** What each button would schedule, so the SM-2 maths is visible. */
  function preview(w: VocabularyItem, q: number) {
    if (q < 3) return "again";
    const reps = (w.repetitions || 0) + 1;
    const ef = w.easiness ?? 2.5;
    const days = reps === 1 ? 1 : reps === 2 ? 6 : Math.round((w.interval || 1) * ef);
    return `${days}d`;
  }

  return (
    <Page
      title="Practice deck"
      subtitle="Words you looked up and words Ustad caught you mispronouncing, scheduled with spaced repetition (SM-2) so each one comes back just before you'd forget it."
    >
      {error && <ErrorNote>{error}</ErrorNote>}
      {loading ? (
        <p className="text-[#94725a]">Loading…</p>
      ) : words.length === 0 ? (
        <Card className="text-center">
          <BookMarked className="mx-auto text-[#c26a3b]" />
          <p className="mt-3 text-[#7d5b44]">
            Your deck is empty. Tap words on a scanned sher, or recite with{" "}
            <Link to="/ustad" className="text-[#c26a3b] underline">Ustad</Link> — mispronounced words land here.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              ["Due now", due.length],
              ["In deck", words.length],
              ["Mastered", words.filter((w) => w.strength >= 80).length],
            ].map(([k, v]) => (
              <Card key={k as string} className="!p-4 text-center">
                <div className="text-2xl font-bold tabular-nums text-[#5a2e14]">{v}</div>
                <div className="text-xs text-[#94725a]">{k}</div>
              </Card>
            ))}
          </div>

          {!reviewMode && due.length > 0 && (
            <button
              type="button"
              onClick={startReview}
              className="mb-6 w-full py-3 rounded-full bg-[#c26a3b] hover:bg-[#a9552a] text-white font-medium"
            >
              Review {due.length} due word{due.length > 1 ? "s" : ""}
            </button>
          )}

          {reviewMode && (
            <Card className="mb-8 text-center">
              {card ? (
                <>
                  <span className="text-xs uppercase tracking-[0.25em] text-[#b08a6a]">
                    {queue.length} left
                  </span>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <span className="font-deva text-4xl text-[#3b2419]">{card.word}</span>
                    <SpeakButton text={card.word} compact />
                    <SpeakButton text={card.word} slow compact />
                  </div>
                  {card.source === "ustad" && (
                    <p className="mt-2 text-xs text-[#8a3412] inline-flex items-center gap-1">
                      <Mic2 size={12} /> Ustad caught this {card.mistakes > 1 ? `${card.mistakes} times` : "once"}
                    </p>
                  )}
                  {!revealed ? (
                    <button
                      type="button"
                      onClick={() => setRevealed(true)}
                      className="mt-6 px-6 py-2.5 rounded-full border border-[#e2c9ad] text-[#5a321c] hover:bg-[#f6e2cf]"
                    >
                      Show meaning
                    </button>
                  ) : (
                    <>
                      {card.roman && <p className="mt-4 italic text-[#7d5b44]">{card.roman}</p>}
                      <p className="mt-2 text-lg text-[#3b2419]">{card.meaning || "—"}</p>
                      {card.tip && <p className="mt-2 text-sm text-[#8a3412]">🗣 {card.tip}</p>}
                      <p className="mt-6 text-xs text-[#94725a]">How well did you know it?</p>
                      <div className="mt-2 grid grid-cols-4 gap-2">
                        {GRADES.map((g) => (
                          <button
                            key={g.q}
                            type="button"
                            disabled={busy}
                            onClick={() => grade(card.id, g.q)}
                            className={`py-2 rounded-xl border text-sm font-medium disabled:opacity-50 ${g.cls}`}
                          >
                            {g.label}
                            <span className="block text-[10px] opacity-70">{preview(card, g.q)}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <p className="text-[#3f7d3a] font-medium">All caught up for today. Shabaash! 🌙</p>
              )}
              {lastResult && <p className="mt-4 text-xs text-[#94725a]">{lastResult}</p>}
              <button
                type="button"
                onClick={() => setReviewMode(false)}
                className="mt-5 text-sm text-[#94725a] hover:text-[#3b2419]"
              >
                Close review
              </button>
            </Card>
          )}

          <ul className="space-y-3">
            {words.map((w) => (
              <li key={w.id} className="p-4 rounded-2xl border border-[#ecd6bd] bg-[#fff8f0] flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-deva text-xl text-[#3b2419]">{w.word}</span>
                    {w.roman && <span className="text-sm italic text-[#7d5b44]">{w.roman}</span>}
                    {w.source === "ustad" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fdeee4] text-[#8a3412]">from Ustad</span>
                    )}
                  </div>
                  <p className="text-sm text-[#5a3a28] mt-1">{w.meaning || "—"}</p>
                  {w.tip && <p className="text-xs text-[#8a3412] mt-1">{w.tip}</p>}
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-1.5 w-32 rounded-full bg-[#f0dfcc] overflow-hidden" aria-label={`Strength ${w.strength}%`}>
                      <div className="h-full bg-[#c26a3b]" style={{ width: `${w.strength}%` }} />
                    </div>
                    <span className={`text-xs ${w.isDue ? "text-[#8a3412] font-medium" : "text-[#94725a]"}`}>{dueLabel(w)}</span>
                  </div>
                </div>
                <SpeakButton text={w.word} compact />
              </li>
            ))}
          </ul>
        </>
      )}
    </Page>
  );
}
