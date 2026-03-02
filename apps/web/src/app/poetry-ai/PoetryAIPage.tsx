import {useEffect, useState} from "react";
import {useParams, useLocation, useNavigate, Link} from "react-router-dom";
import {api, API_BASE} from "../../config/api";
import {collection, getDocs, query, where} from "firebase/firestore";
import {db} from "../../services/firebase";
import Comments from "../../components/Comments";
import FollowPoet from "../../components/FollowPoet";
import AudioPlayer from "../../components/AudioPlayer";
import Recorder from "../../components/Recorder";
import OfficialRecitations from "../../components/OfficialRecitations.tsx";
import {useAuth} from "../../hooks/useAuth";

type Message = {role: "user" | "ai"; text: string; disclaimer?: string};

export default function PoetryAIPage() {
  const navigate = useNavigate();
  const {textHash: paramHash} = useParams<{textHash?: string}>();
  const {state} = useLocation() as {
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

  const textHash = paramHash ?? state?.textHash ?? state?.cacheHash ?? "";
  const text = state?.text ?? "";
  const explanation = state?.explanation ?? state?.tashreeh ?? "";
  const ocrConfidence =
    typeof state?.ocrConfidence === "number" ? state.ocrConfidence : null;
  const attributionConfidence =
    typeof state?.attributionConfidence === "number"
      ? state.attributionConfidence
      : null;

  const sherId: string | undefined =
    typeof textHash === "string" && textHash.length > 0 ? textHash : undefined;

  const {isAuthenticated} = useAuth();
  const [poet, setPoet] = useState(state?.poet ?? "");
  const [similar, setSimilar] = useState<any[]>([]);

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [level, setLevel] = useState<"beginner" | "intermediate" | "scholar">(
    "beginner"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSimilar() {
      if (!poet) return;
      try {
        const q = query(
          collection(db, "global_poetry_cache"),
          where("poet", "==", poet)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((doc) => doc.data());
        setSimilar(data.slice(0, 3));
      } catch (e) {
        console.error("Failed to load similar shers", e);
      }
    }

    void fetchSimilar();
  }, [poet]);

  async function ask() {
    if (!question.trim() || !sherId) {
      setError(
        sherId
          ? "Please enter a question."
          : "No sher selected. Open a sher from History or Search first."
      );
      return;
    }
    setError(null);
    setLoading(true);
    console.log("API BASE:", API_BASE);
    console.log("Calling poetry-chat...", api.poetryChat);
    try {
      const res = await fetch(api.poetryChat, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          textHash: sherId,
          question: question.trim(),
          level,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {role: "user", text: question},
          {role: "ai", text: data?.error ?? "Request failed."},
        ]);
        setQuestion("");
        setLoading(false);
        return;
      }
      setMessages((prev) => [
        ...prev,
        {role: "user", text: question},
        {
          role: "ai",
          text: data.answer ?? "",
          disclaimer: data.disclaimer,
        },
      ]);
      setQuestion("");
    } catch {
      setMessages((prev) => [
        ...prev,
        {role: "user", text: question},
        {role: "ai", text: "Network error. Please try again."},
      ]);
      setQuestion("");
    } finally {
      setLoading(false);
    }
  }

  if (!sherId || !text) {
    return (
      <div
        className="min-h-screen text-[#3b2419] px-4 py-10 flex flex-col items-center justify-center gap-4 bg-cover bg-no-repeat bg-top"
        style={{backgroundImage: "url('/images/background-lanterns.png')"}}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 mb-4 rounded-full bg-[#f6d3b5] text-[#5a321c] text-sm font-medium shadow-sm hover:bg-[#ecbf98] transition-colors"
        >
          <span aria-hidden>←</span>
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-semibold">Ask the AI about a sher</h1>
        <p className="text-[#94725a] text-center max-w-sm text-sm">
          Open a sher from{" "}
          <Link to="/history" className="text-[#c26a3b] hover:underline">
            History
          </Link>
          ,{" "}
          <Link to="/search" className="text-[#c26a3b] hover:underline">
            Search
          </Link>{" "}
          and use the{" "}
          <span className="font-semibold">Ask the AI about this sher</span>{" "}
          option.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fff7ef] via-[#fbeee0] to-[#f6e2cf] text-[#3b2419] px-4 sm:px-8 py-6 sm:py-10">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* Left: poem, recitations, explanation, comments */}
        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-[#f6d3b5] text-[#5a321c] text-sm font-medium shadow-sm hover:bg-[#ecbf98] transition-colors"
          >
            <span aria-hidden>←</span>
            <span>Back</span>
          </button>

          <div className="mb-6 flex flex-wrap items-center gap-4">
            <label className="text-sm text-[#94725a]">Poet</label>
            <select
              value={poet}
              onChange={(e) => setPoet(e.target.value)}
              className="bg-[#fbe1c7] text-[#3b2419] text-sm px-3 py-2 rounded-lg border border-[#f0c9a0] shadow-sm"
            >
              <option value="">Unknown Poet</option>
              <option value="Mirza Ghalib">Mirza Ghalib</option>
              <option value="Mir Taqi Mir">Mir Taqi Mir</option>
              <option value="Faiz Ahmed Faiz">Faiz Ahmed Faiz</option>
            </select>
            {poet && <FollowPoet poetId={poet} />}
          </div>

          <div className="rounded-3xl bg-[#fff8f0] border border-[#f0d9c2] shadow-[0_20px_60px_rgba(0,0,0,0.08)] px-6 sm:px-8 py-6 sm:py-8 space-y-6">
            <div className="text-2xl sm:text-3xl leading-relaxed font-semibold whitespace-pre-wrap text-[#3b2419] text-right">
              {text.split("\n").map((line: string, lineIdx: number) => (
                <p key={lineIdx} className="mb-2">
                  {line}
                </p>
              ))}
            </div>

            <div className="space-y-4">
              <AudioPlayer
                text={text}
                secondaryControl={
                  sherId && isAuthenticated ? <Recorder sherId={sherId} /> : null
                }
              />
              {sherId && <OfficialRecitations sherId={sherId} />}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f0d9c2] pt-4">
              <button
                type="button"
                onClick={() => {
                  if (navigator.share && text) {
                    void navigator.share({text}).catch(() => {});
                  } else if (navigator.clipboard && text) {
                    void navigator.clipboard.writeText(text).catch(() => {});
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#fff3e0] text-[#5a321c] text-sm font-medium hover:bg-[#fbe1c7] transition-colors"
              >
                Share Quote
              </button>

              {(ocrConfidence != null || attributionConfidence != null) && (
                <p className="text-xs sm:text-sm text-[#94725a]">
                  {ocrConfidence != null && (
                    <>OCR Confidence: {(ocrConfidence * 100).toFixed(1)}%</>
                  )}
                  {attributionConfidence != null && (
                    <>
                      {" "}
                      | Attribution Confidence:{" "}
                      {attributionConfidence === 1 ? "Confirmed" : "Unverified"}
                    </>
                  )}
                </p>
              )}
            </div>
          </div>

          {explanation && (
            <div className="mt-6 rounded-3xl bg-[#fff8f0] border border-[#f0d9c2] shadow-sm px-6 py-5 text-base sm:text-lg leading-relaxed text-[#5a3a28] whitespace-pre-wrap">
              {explanation}
            </div>
          )}

          {similar.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl mb-3 text-[#3b2419]">Similar Shers</h2>
              {similar.map((item, i) => (
                <div
                  key={i}
                  className="mb-3 rounded-2xl bg-[#fff8f0] border border-[#f0d9c2] px-4 py-3 text-[#6b4a33]"
                >
                  {item.text}
                </div>
              ))}
            </div>
          )}

          {sherId && (
            <div className="mt-8">
              <Comments sherId={sherId} />
            </div>
          )}
        </div>

        {/* Right: AI card */}
        <div className="w-full lg:w-[360px] xl:w-[400px] flex-shrink-0">
          <div
            className="relative h-full rounded-[32px] border border-[#f0d9c2] shadow-[0_20px_60px_rgba(0,0,0,0.12)] overflow-hidden"
            style={{
              backgroundImage: "url('/images/poetry-ai-panel.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-[#f9e4cc]/75" />

            <div className="relative h-full px-6 py-7 flex flex-col">
              <h2 className="text-lg font-semibold text-[#5a321c] mb-2">
                Ask the AI about this sher
              </h2>
              <p className="text-xs text-[#b08a6a] mb-4">
                Ask about symbolism, metaphor, or historical context. Interpretations
                are helpful guides, not absolute facts.
              </p>

              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-[#94725a]">Level</span>
                <select
                  value={level}
                  onChange={(e) =>
                    setLevel(
                      e.target.value as "beginner" | "intermediate" | "scholar"
                    )
                  }
                  className="text-xs bg-[#fbe1c7] text-[#3b2419] px-2 py-1 rounded-lg border border-[#f0c9a0]"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="scholar">Scholar</option>
                </select>
              </div>

              {error && (
                <p className="mt-2 text-xs text-red-600" role="alert">
                  {error}
                </p>
              )}

              <div className="mt-4 flex gap-2">
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      ask();
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-[#fff8f0] rounded-xl border border-[#f0c9a0] placeholder-[#c39a79] text-xs focus:outline-none focus:ring-2 focus:ring-[#d18a4c]/40"
                  placeholder="Ask the AI about this sher..."
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={ask}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-[#d18a4c] hover:bg-[#b96f35] disabled:opacity-50 text-xs font-semibold text-white shadow-sm transition-colors"
                >
                  {loading ? "…" : "Ask"}
                </button>
              </div>

              {(ocrConfidence != null || attributionConfidence != null) && (
                <p className="mt-3 text-[11px] text-[#b08a6a]">
                  {ocrConfidence != null && (
                    <>OCR Confidence: {(ocrConfidence * 100).toFixed(1)}%</>
                  )}
                  {attributionConfidence != null && (
                    <>
                      {" "}
                      | Attribution Confidence:{" "}
                      {attributionConfidence === 1 ? "Confirmed" : "Unverified"}
                    </>
                  )}
                </p>
              )}

              {messages.length > 0 && (
                <div className="mt-4 max-h-80 overflow-y-auto space-y-3 pr-1">
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className="text-xs bg-[#fff8f0]/90 rounded-2xl px-3 py-2 border border-[#f0d9c2]"
                    >
                      <strong className="text-[#94725a]">
                        {m.role === "ai" ? "AI" : "You"}:
                      </strong>
                      <p className="mt-1 whitespace-pre-wrap text-[#5a3a28]">
                        {m.text}
                      </p>
                      {m.role === "ai" && m.disclaimer && (
                        <p className="mt-1 text-[10px] text-[#b08a6a] italic">
                          {m.disclaimer}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
