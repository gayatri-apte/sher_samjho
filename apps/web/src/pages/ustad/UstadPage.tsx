import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { BookMarked, RotateCcw, Sparkles, Play, Info } from "lucide-react";
import Page, { Card, ErrorNote } from "../../components/ui/Page";
import MicButton from "../../components/voice/MicButton";
import SpeakButton from "../../components/voice/SpeakButton";
import { api } from "../../config/api";
import { apiJSON, type Sher } from "../../lib/http";
import { speak, stopSpeaking } from "../../lib/audio/speak";
import type { Recording } from "../../lib/audio/useVoiceRecorder";
import { useAuth } from "../../hooks/useAuth";
import { guestLogin } from "../../services/auth.service";

type WordVerdict = {
  ref: string;
  roman: string;
  heard: string;
  status: "correct" | "mispronounced" | "missed" | "extra";
  issue: string;
  tip: string;
  meaning: string;
};

type ReciteResult = {
  transcript: string;
  audioQuality: "good" | "noisy" | "silent" | "unrelated";
  overallScore: number;
  pronunciationScore: number;
  fluencyScore: number;
  completenessScore: number;
  words: WordVerdict[];
  ustadSays: string;
  deliveryTips: string[];
  mistakes: number;
  addedToDeck: number;
};

type Attempt = { score: number; at: number; url: string };

type RefSher = {
  id?: string;
  devanagari: string;
  urdu?: string;
  roman?: string;
  poet?: string;
};

const STATUS_STYLE: Record<WordVerdict["status"], string> = {
  correct: "bg-[#e6f2e4] border-[#b7d7b0] text-[#24502a]",
  mispronounced:
    "bg-[#fdeee4] border-[#e7a37f] text-[#8a3412] underline decoration-wavy decoration-[#d0632b] underline-offset-4",
  missed: "bg-[#efe9e4] border-[#d6c9bd] text-[#8b7b6e] line-through",
  extra: "bg-[#f3eafa] border-[#d3bde7] text-[#5b3d7a] italic",
};

function scoreColor(s: number) {
  if (s >= 80) return "#3f7d3a";
  if (s >= 55) return "#c26a3b";
  return "#9b2c2c";
}

function ScoreRing({ score }: { score: number }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-32 h-32 shrink-0" role="img" aria-label={`Score ${score} out of 100`}>
      <svg viewBox="0 0 110 110" className="w-full h-full -rotate-90">
        <circle cx="55" cy="55" r={r} fill="none" stroke="#f0dfcc" strokeWidth="10" />
        <circle
          cx="55"
          cy="55"
          r={r}
          fill="none"
          stroke={scoreColor(score)}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          style={{ transition: "stroke-dashoffset 900ms ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums" style={{ color: scoreColor(score) }}>
          {score}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-[#94725a]">score</span>
      </div>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-[#7d5b44] mb-1">
        <span>{label}</span>
        <span className="tabular-nums">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-[#f0dfcc] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, background: scoreColor(value) }}
        />
      </div>
    </div>
  );
}

export default function UstadPage() {
  const { sherId } = useParams<{ sherId?: string }>();
  const { state } = useLocation() as {
    state?: { text?: string; cacheHash?: string; poet?: string; referenceText?: string; roman?: string };
  };
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [sher, setSher] = useState<RefSher | null>(null);
  const [loadingSher, setLoadingSher] = useState(true);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReciteResult | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const resultRef = useRef<HTMLDivElement>(null);

  // Load the reference sher: route param → router state → sher of the day.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingSher(true);
      setError(null);
      try {
        const id = sherId ?? state?.cacheHash;
        if (id) {
          const s = await apiJSON<Sher>(api.sher(id));
          if (!cancelled)
            setSher({ id: s.id, devanagari: s.devanagariText ?? "", urdu: s.rawUrdu, roman: s.romanText, poet: s.poet });
        } else if (state?.referenceText || state?.text) {
          setSher({
            devanagari: (state.referenceText ?? state.text ?? "").trim(),
            roman: state.roman,
            poet: state.poet,
          });
        } else {
          const s = await apiJSON<Sher | null>(api.dailySher);
          if (!cancelled && s)
            setSher({ id: s.id, devanagari: s.devanagariText ?? "", urdu: s.rawUrdu, roman: s.romanText, poet: s.poet });
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load the sher");
      } finally {
        if (!cancelled) setLoadingSher(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
      stopSpeaking();
    };
  }, [sherId, state]);

  const isUrduScript = !!sher?.urdu && /[؀-ۿ]/.test(sher.urdu);

  async function evaluate(rec: Recording) {
    if (!sher) return;
    setBusy(true);
    setError(null);
    setSelected(null);
    try {
      if (!isAuthenticated) await guestLogin();
      const r = await apiJSON<ReciteResult>(api.recite, {
        body: {
          audio: rec.base64,
          mimeType: rec.mimeType,
          ...(sher.id ? { sherId: sher.id } : { referenceText: sher.devanagari }),
        },
        requireAuth: true,
      });
      setResult(r);
      setAttempts((a) => [...a, { score: r.overallScore, at: Date.now(), url: rec.url }]);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
      // The ustad speaks the feedback out loud.
      speak(r.ustadSays, 0.95).catch(() => undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not check the recitation");
    } finally {
      setBusy(false);
    }
  }

  const improvement = useMemo(() => {
    if (attempts.length < 2) return null;
    return attempts[attempts.length - 1].score - attempts[0].score;
  }, [attempts]);

  const sel = selected != null && result ? result.words[selected] : null;

  return (
    <Page
      title="Ustad"
      subtitle={
        <>
          Your AI recitation coach. Listen, recite the sher aloud, and Ustad
          catches your <em>talaffuz</em> slips (qaaf/kaaf, ḳhe/khe, izafat…)
          word by word. Words you miss go straight into your practice deck.
        </>
      }
      width="lg"
    >
      {/* 1. The sher */}
      <Card>
        {loadingSher ? (
          <p className="text-[#94725a]">Loading a sher…</p>
        ) : sher?.devanagari ? (
          <>
            <div className="flex items-center justify-between gap-3 mb-4">
              <span className="text-xs uppercase tracking-[0.25em] text-[#b08a6a]">
                Step 1 · Listen
              </span>
              {sher.poet && <span className="text-sm text-[#94725a]">— {sher.poet}</span>}
            </div>
            {isUrduScript && (
              <p dir="rtl" lang="ur" className="font-urdu text-2xl sm:text-3xl leading-[2.4] text-center text-[#3b2419] whitespace-pre-line mb-3">
                {sher.urdu}
              </p>
            )}
            <p lang="hi" className="font-deva text-2xl sm:text-3xl leading-relaxed text-center text-[#3b2419] whitespace-pre-line">
              {sher.devanagari}
            </p>
            {sher.roman && (
              <p className="mt-3 text-center text-[#7d5b44] italic whitespace-pre-line">{sher.roman}</p>
            )}
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <SpeakButton text={isUrduScript ? sher.urdu! : sher.devanagari} label="Listen" />
              <SpeakButton text={isUrduScript ? sher.urdu! : sher.devanagari} slow label="Slow, word by word" />
            </div>
          </>
        ) : (
          <div>
            <p className="text-[#7d5b44] mb-3">
              No sher selected yet. Paste one (Devanagari works best), or scan one first.
            </p>
            <textarea
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              rows={3}
              placeholder="दिल-ए-नादाँ तुझे हुआ क्या है / आख़िर इस दर्द की दवा क्या है"
              className="w-full rounded-xl border border-[#e2c9ad] bg-[#fffaf4] p-3 font-deva text-lg focus:outline-none focus:ring-2 focus:ring-[#c26a3b]/40"
            />
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                disabled={!custom.trim()}
                onClick={() => setSher({ devanagari: custom.replace(/\s*\/\s*/g, "\n").trim() })}
                className="px-4 py-2 rounded-full bg-[#c26a3b] text-white text-sm font-medium disabled:opacity-50"
              >
                Use this sher
              </button>
              <Link to="/scan" className="px-4 py-2 rounded-full border border-[#e2c9ad] text-sm text-[#5a321c]">
                Scan a sher
              </Link>
            </div>
          </div>
        )}
      </Card>

      {/* 2. Recite */}
      {sher?.devanagari && (
        <Card className="mt-6 text-center">
          <span className="text-xs uppercase tracking-[0.25em] text-[#b08a6a]">
            Step 2 · Recite it aloud
          </span>
          <div className="mt-5">
            <MicButton
              size="lg"
              onRecorded={evaluate}
              busy={busy}
              label={result ? "Try again" : "Tap and recite"}
              busyLabel="Ustad is listening to every word…"
            />
          </div>
          {!isAuthenticated && (
            <p className="mt-3 text-xs text-[#94725a]">
              We'll sign you in as a guest so your progress is saved.
            </p>
          )}
          {error && <ErrorNote>{error}</ErrorNote>}
        </Card>
      )}

      {/* 3. Feedback */}
      {result && (
        <div ref={resultRef} className="scroll-mt-20">
          <Card className="mt-6">
            <span className="text-xs uppercase tracking-[0.25em] text-[#b08a6a]">
              Step 3 · Ustad's feedback
            </span>

            <div className="mt-4 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
              <ScoreRing score={result.overallScore} />
              <div className="flex-1 w-full space-y-3">
                <Bar label="Pronunciation (talaffuz)" value={result.pronunciationScore} />
                <Bar label="Fluency (rawani)" value={result.fluencyScore} />
                <Bar label="Completeness" value={result.completenessScore} />
                {improvement != null && (
                  <p className={`text-sm font-medium ${improvement >= 0 ? "text-[#3f7d3a]" : "text-[#9b2c2c]"}`}>
                    {improvement >= 0 ? "▲" : "▼"} {Math.abs(improvement)} points since your first attempt
                  </p>
                )}
              </div>
            </div>

            <blockquote className="mt-6 rounded-2xl bg-[#fbeee0] border-l-4 border-[#c26a3b] px-5 py-4">
              <div className="flex items-start gap-3">
                <Sparkles size={18} className="text-[#c26a3b] mt-1 shrink-0" />
                <div className="flex-1">
                  <p className="text-[#3b2419] leading-relaxed">{result.ustadSays}</p>
                  <div className="mt-2 flex gap-2">
                    <SpeakButton text={result.ustadSays} label="Hear Ustad again" />
                  </div>
                </div>
              </div>
            </blockquote>

            {result.audioQuality !== "good" && (
              <p className="mt-3 text-sm text-[#8a3412] flex items-center gap-2">
                <Info size={14} />
                {result.audioQuality === "noisy"
                  ? "It was a bit noisy — a quieter spot gives a fairer score."
                  : result.audioQuality === "silent"
                    ? "Ustad couldn't hear anything. Check your mic and try again."
                    : "That sounded like a different sher. Recite the one above."}
              </p>
            )}

            <h3 className="mt-7 mb-3 font-semibold text-[#5a2e14]">Word by word — tap any word</h3>
            <div className="flex flex-wrap gap-2 font-deva text-lg" lang="hi">
              {result.words.map((w, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setSelected(i);
                    speak(w.ref, 0.6).catch(() => undefined);
                  }}
                  className={`px-3 py-1 rounded-xl border transition-shadow hover:shadow ${STATUS_STYLE[w.status]} ${
                    selected === i ? "ring-2 ring-[#c26a3b]" : ""
                  }`}
                  title={w.status}
                >
                  {w.ref || w.heard}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#7d5b44]">
              <span><span className="inline-block w-3 h-3 rounded bg-[#e6f2e4] border border-[#b7d7b0] mr-1 align-middle" />correct</span>
              <span><span className="inline-block w-3 h-3 rounded bg-[#fdeee4] border border-[#e7a37f] mr-1 align-middle" />mispronounced</span>
              <span><span className="inline-block w-3 h-3 rounded bg-[#efe9e4] border border-[#d6c9bd] mr-1 align-middle" />missed</span>
            </div>

            {sel && (
              <div className="mt-4 rounded-2xl border border-[#ecd6bd] bg-white/70 p-4">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="font-deva text-2xl text-[#3b2419]">{sel.ref}</span>
                  {sel.roman && <span className="italic text-[#7d5b44]">{sel.roman}</span>}
                  {sel.meaning && <span className="text-sm text-[#94725a]">“{sel.meaning}”</span>}
                </div>
                {sel.status !== "correct" ? (
                  <div className="mt-2 text-sm text-[#5a3a28] space-y-1">
                    {sel.heard && <p>You said: <span className="font-deva">{sel.heard}</span></p>}
                    {sel.issue && <p className="font-medium text-[#8a3412]">{sel.issue}</p>}
                    {sel.tip && <p>{sel.tip}</p>}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-[#3f7d3a]">Bilkul sahi — well said.</p>
                )}
                <div className="mt-3 flex gap-2">
                  <SpeakButton text={sel.ref} label="Hear it" />
                  <SpeakButton text={sel.ref} slow label="Slowly" />
                </div>
              </div>
            )}

            {result.deliveryTips?.length > 0 && (
              <>
                <h3 className="mt-7 mb-2 font-semibold text-[#5a2e14]">Mushaira delivery tips</h3>
                <ul className="list-disc pl-5 space-y-1 text-[#5a3a28]">
                  {result.deliveryTips.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </>
            )}

            <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-[#f0d9c2] pt-5">
              {result.addedToDeck > 0 && (
                <button
                  type="button"
                  onClick={() => navigate("/vocabulary")}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#c26a3b] text-white text-sm font-medium hover:bg-[#a9552a]"
                >
                  <BookMarked size={16} />
                  {result.addedToDeck} word{result.addedToDeck > 1 ? "s" : ""} added to your practice deck
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#e2c9ad] text-sm text-[#5a321c] hover:bg-[#f6e2cf]"
              >
                <RotateCcw size={16} /> Try again
              </button>
              {attempts.length > 0 && (
                <button
                  type="button"
                  onClick={() => new Audio(attempts[attempts.length - 1].url).play()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#e2c9ad] text-sm text-[#5a321c] hover:bg-[#f6e2cf]"
                >
                  <Play size={16} /> Play my recitation
                </button>
              )}
            </div>
            {attempts.length > 1 && (
              <p className="mt-3 text-xs text-[#94725a]">
                Attempts: {attempts.map((a) => a.score).join(" → ")}
              </p>
            )}
            <p className="mt-4 text-[11px] text-[#b08a6a]">
              Ustad is an AI coach, not a real poet. AI feedback can be wrong — trust your teacher's ear too.
            </p>
          </Card>
        </div>
      )}
    </Page>
  );
}
