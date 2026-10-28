import { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { Mic2, Send, Share2 } from "lucide-react";
import { api } from "../../config/api";
import { apiJSON, sherState, tashreehText, type Sher } from "../../lib/http";
import Comments from "../../components/Comments";
import FollowPoet from "../../components/FollowPoet";
import OfficialRecitations from "../../components/OfficialRecitations";
import MicButton from "../../components/voice/MicButton";
import SpeakButton from "../../components/voice/SpeakButton";
import type { Recording } from "../../lib/audio/useVoiceRecorder";
import { useAuth } from "../../hooks/useAuth";

type Message = { role: "user" | "ai"; text: string; disclaimer?: string };
type Level = "beginner" | "intermediate" | "scholar";

const POETS = ["Mirza Ghalib", "Mir Taqi Mir", "Faiz Ahmed Faiz", "Allama Iqbal", "Jaun Elia", "Ahmad Faraz"];

export default function PoetryAIPage() {
  const navigate = useNavigate();
  const { textHash: paramHash } = useParams<{ textHash?: string }>();
  const { state } = useLocation() as {
    state?: {
      cacheHash?: string;
      textHash?: string;
      text?: string;
      explanation?: string;
      tashreeh?: string;
      poet?: string;
      ocrConfidence?: number;
      attributionConfidence?: number;
    };
  };
  const sherId = paramHash ?? state?.textHash ?? state?.cacheHash ?? "";
  const { isAuthenticated } = useAuth();

  const [text, setText] = useState(state?.text ?? "");
  const [explanation, setExplanation] = useState(state?.explanation ?? state?.tashreeh ?? "");
  const [poet, setPoet] = useState(state?.poet ?? "");
  const [ocrConfidence] = useState<number | null>(
    typeof state?.ocrConfidence === "number" ? state.ocrConfidence : null,
  );
  const [loadingSher, setLoadingSher] = useState(!state?.text && !!sherId);
  const [similar, setSimilar] = useState<Sher[]>([]);

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [level, setLevel] = useState<Level>("beginner");
  const [loading, setLoading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEnd = useRef<HTMLDivElement>(null);

  // Deep links (/poetry-ai/:hash) used to render empty without router state.
  useEffect(() => {
    if (!sherId || state?.text) return;
    let cancelled = false;
    apiJSON<Sher>(api.sher(sherId))
      .then((s) => {
        if (cancelled) return;
        setText(s.devanagariText ?? "");
        setExplanation(tashreehText(s.tashreeh));
        setPoet(s.poet && s.poet !== "Unknown" ? s.poet : "");
      })
      .catch(() => undefined)
      .finally(() => !cancelled && setLoadingSher(false));
    return () => {
      cancelled = true;
    };
  }, [sherId, state?.text]);

  // Similar shers by meaning (was: a poet-equality query rendering `item.text`,
  // a field that doesn't exist, so the cards were always blank).
  useEffect(() => {
    if (!sherId) return;
    apiJSON<Sher[]>(api.similar, { body: { textHash: sherId } })
      .then((list) => setSimilar(Array.isArray(list) ? list.slice(0, 3) : []))
      .catch(() => setSimilar([]));
  }, [sherId]);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  async function ask(q?: string) {
    const qq = (q ?? question).trim();
    if (!qq || !sherId) {
      setError(sherId ? "Please enter a question." : "No sher selected. Open a sher from History or Search first.");
      return;
    }
    setError(null);
    setLoading(true);
    setQuestion("");
    const history = messages.slice(-6);
    setMessages((prev) => [...prev, { role: "user", text: qq }]);
    try {
      const data = await apiJSON<{ answer: string; disclaimer?: string }>(api.poetryChat, {
        body: { textHash: sherId, question: qq, level, history },
      });
      setMessages((prev) => [...prev, { role: "ai", text: data.answer ?? "", disclaimer: data.disclaimer }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "ai", text: e instanceof Error ? e.message : "Request failed." }]);
    } finally {
      setLoading(false);
    }
  }

  async function askByVoice(rec: Recording) {
    setTranscribing(true);
    setError(null);
    try {
      const { text: heard } = await apiJSON<{ text: string }>(api.transcribe, {
        body: { audio: rec.base64, mimeType: rec.mimeType },
      });
      if (!heard) {
        setError("Couldn't hear a question — try again.");
        return;
      }
      await ask(heard);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Voice question failed");
    } finally {
      setTranscribing(false);
    }
  }

  if (loadingSher) {
    return <div className="min-h-[60vh] flex items-center justify-center text-[#94725a]">Loading sher…</div>;
  }

  if (!sherId || !text) {
    return (
      <div
        className="min-h-[calc(100vh-4rem)] text-[#3b2419] px-4 py-10 flex flex-col items-center justify-center gap-4 bg-cover bg-no-repeat bg-top"
        style={{ backgroundImage: "url('/images/background-lanterns.png')" }}
      >
        <h1 className="text-2xl font-semibold">Ask the AI about a sher</h1>
        <p className="text-[#94725a] text-center max-w-sm text-sm">
          Open a sher from <Link to="/history" className="text-[#c26a3b] hover:underline">History</Link>,{" "}
          <Link to="/search" className="text-[#c26a3b] hover:underline">Search</Link> or{" "}
          <Link to="/feed" className="text-[#c26a3b] hover:underline">today's sher</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-[#fff7ef] via-[#fbeee0] to-[#f6e2cf] text-[#3b2419] px-4 sm:px-8 py-6 sm:py-10">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* Left: sher, listen/recite, explanation, comments */}
        <div className="flex-1 min-w-0">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <label htmlFor="poet" className="text-sm text-[#94725a]">Poet</label>
            <select
              id="poet"
              value={poet}
              onChange={(e) => setPoet(e.target.value)}
              className="bg-[#fbe1c7] text-[#3b2419] text-sm px-3 py-2 rounded-lg border border-[#f0c9a0] shadow-sm"
            >
              <option value="">Unknown Poet</option>
              {poet && !POETS.includes(poet) && <option value={poet}>{poet}</option>}
              {POETS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {poet && <FollowPoet poetId={poet} />}
          </div>

          <div className="rounded-3xl bg-[#fff8f0] border border-[#f0d9c2] shadow-[0_20px_60px_rgba(0,0,0,0.08)] px-6 sm:px-8 py-6 sm:py-8 space-y-6">
            <div lang="hi" className="font-deva text-2xl sm:text-3xl leading-relaxed font-semibold whitespace-pre-wrap text-[#3b2419] text-center">
              {text}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <SpeakButton text={text} label="Listen" />
              <SpeakButton text={text} slow label="Slow" />
              <button
                type="button"
                onClick={() => navigate(`/ustad/${encodeURIComponent(sherId)}`, { state: { text, poet, cacheHash: sherId } })}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#c26a3b] text-white text-sm font-medium hover:bg-[#a9552a]"
              >
                <Mic2 size={16} /> Recite with Ustad
              </button>
              <button
                type="button"
                onClick={() => {
                  const url = `${window.location.origin}/poetry-ai/${sherId}`;
                  const share = `${text}${poet ? `\n— ${poet}` : ""}\n\n${url}`;
                  if (navigator.share) void navigator.share({ text: share }).catch(() => undefined);
                  else void navigator.clipboard?.writeText(share);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#fff3e0] text-[#5a321c] text-sm font-medium hover:bg-[#fbe1c7] border border-[#f0d9c2]"
              >
                <Share2 size={16} /> Share
              </button>
            </div>

            <OfficialRecitations sherId={sherId} />

            {ocrConfidence != null && (
              <p className="text-xs text-[#94725a] text-center">
                OCR confidence: {(ocrConfidence * 100).toFixed(0)}% · AI-generated text may contain errors
              </p>
            )}
          </div>

          {explanation && (
            <div className="mt-6 rounded-3xl bg-[#fff8f0] border border-[#f0d9c2] shadow-sm px-6 py-5">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-[#5a2e14]">Tashreeh (meaning)</h2>
                <SpeakButton text={explanation} compact />
              </div>
              <p lang="hi" className="font-deva text-base sm:text-lg leading-relaxed text-[#5a3a28] whitespace-pre-wrap">
                {explanation}
              </p>
            </div>
          )}

          {similar.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl mb-3 text-[#3b2419]">Similar shers</h2>
              {similar.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(`/poetry-ai/${item.id}`, { state: sherState(item) })}
                  className="block w-full text-left mb-3 rounded-2xl bg-[#fff8f0] border border-[#f0d9c2] px-4 py-3 text-[#6b4a33] hover:bg-[#f6e2cf]"
                >
                  {item.poet && <div className="text-xs text-[#94725a]">{item.poet}</div>}
                  <div className="font-deva whitespace-pre-line">{item.devanagariText}</div>
                </button>
              ))}
            </div>
          )}

          <div className="mt-8">
            <Comments sherId={sherId} />
          </div>
        </div>

        {/* Right: AI card */}
        <aside className="w-full lg:w-[380px] xl:w-[420px] flex-shrink-0">
          <div
            className="relative lg:sticky lg:top-20 rounded-[32px] border border-[#f0d9c2] shadow-[0_20px_60px_rgba(0,0,0,0.12)] overflow-hidden"
            style={{ backgroundImage: "url('/images/poetry-ai-panel.png')", backgroundSize: "cover", backgroundPosition: "center" }}
          >
            <div className="absolute inset-0 bg-[#f9e4cc]/85" />
            <div className="relative px-6 py-7 flex flex-col">
              <h2 className="text-lg font-semibold text-[#5a321c] mb-1">Talk to the tashreeh</h2>
              <p className="text-xs text-[#94725a] mb-4">
                Ask by voice or text — symbolism, a word, the history. Answers can be read aloud.
              </p>

              <div className="flex items-center gap-2">
                <label htmlFor="lvl" className="text-xs text-[#94725a]">Level</label>
                <select
                  id="lvl"
                  value={level}
                  onChange={(e) => setLevel(e.target.value as Level)}
                  className="text-xs bg-[#fbe1c7] text-[#3b2419] px-2 py-1 rounded-lg border border-[#f0c9a0]"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="scholar">Scholar</option>
                </select>
              </div>

              {messages.length === 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {["Is sher ka matlab simple mein?", "What does the main metaphor mean?", "Which word is hardest to pronounce?"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => ask(s)}
                      className="text-xs px-3 py-1.5 rounded-full bg-[#fff8f0] border border-[#f0c9a0] text-[#5a321c] hover:bg-[#fbe1c7]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-4 max-h-[50vh] overflow-y-auto space-y-3 pr-1" aria-live="polite">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`text-sm rounded-2xl px-3 py-2 border ${
                      m.role === "ai" ? "bg-[#fff8f0]/95 border-[#f0d9c2]" : "bg-[#5a2e14] text-[#fff3e4] border-transparent ml-8"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    {m.role === "ai" && (
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[10px] text-[#b08a6a] italic">{m.disclaimer}</span>
                        <SpeakButton text={m.text} compact />
                      </div>
                    )}
                  </div>
                ))}
                {loading && <p className="text-xs text-[#94725a]">Thinking…</p>}
                <div ref={chatEnd} />
              </div>

              {error && <p className="mt-2 text-xs text-red-700" role="alert">{error}</p>}

              <div className="mt-4 flex items-end gap-2">
                <MicButton
                  onRecorded={askByVoice}
                  busy={transcribing}
                  maxSeconds={20}
                  label="Ask"
                  busyLabel="…"
                />
                <form
                  className="flex-1 flex gap-2 mb-6"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void ask();
                  }}
                >
                  <input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="flex-1 min-w-0 px-3 py-2 bg-[#fff8f0] rounded-xl border border-[#f0c9a0] placeholder-[#c39a79] text-sm focus:outline-none focus:ring-2 focus:ring-[#d18a4c]/40"
                    placeholder="Ask about this sher…"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !question.trim()}
                    aria-label="Ask"
                    className="px-3 rounded-xl bg-[#d18a4c] hover:bg-[#b96f35] disabled:opacity-50 text-white"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
              {!isAuthenticated && (
                <p className="text-[11px] text-[#b08a6a]">Sign in to comment and follow poets.</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
