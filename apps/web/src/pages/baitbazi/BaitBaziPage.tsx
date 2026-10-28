import { useEffect, useRef, useState } from "react";
import { Swords, RotateCcw, Send } from "lucide-react";
import Page, { Card, ErrorNote } from "../../components/ui/Page";
import MicButton from "../../components/voice/MicButton";
import SpeakButton from "../../components/voice/SpeakButton";
import { api } from "../../config/api";
import { apiJSON } from "../../lib/http";
import { speak, stopSpeaking } from "../../lib/audio/speak";
import type { Recording } from "../../lib/audio/useVoiceRecorder";

type Turn = {
  heard: string;
  isRecognizedSher: boolean;
  poet: string;
  firstLetter: string;
  lastLetter: string;
  followsRule: boolean;
  points: number;
  verdict: string;
  aiSher: { devanagari: string; roman: string; poet: string; meaning: string };
  nextLetter: string;
};

type Entry =
  | { who: "you"; turn: Turn; required: string | null }
  | { who: "ai"; sher: Turn["aiSher"]; nextLetter: string };

const AI_POINTS = 8;

export default function BaitBaziPage() {
  const [log, setLog] = useState<Entry[]>([]);
  const [required, setRequired] = useState<string | null>(null);
  const [you, setYou] = useState(0);
  const [ai, setAi] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [log]);
  useEffect(() => () => stopSpeaking(), []);

  const used = log.flatMap((e) =>
    e.who === "you" ? [e.turn.heard] : [e.sher.devanagari],
  );

  async function play(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const t = await apiJSON<Turn>(api.baitBazi, {
        body: { ...body, requiredLetter: required, used },
      });
      setLog((l) => [
        ...l,
        { who: "you", turn: t, required },
        { who: "ai", sher: t.aiSher, nextLetter: t.nextLetter },
      ]);
      setYou((s) => s + t.points);
      setAi((s) => s + AI_POINTS);
      setRequired(t.nextLetter);
      setText("");
      // The AI recites its reply, like a real duel.
      speak(t.aiSher.devanagari, 0.85).catch(() => undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Turn failed");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    stopSpeaking();
    setLog([]);
    setRequired(null);
    setYou(0);
    setAi(0);
    setError(null);
  }

  return (
    <Page
      title="Bait-bazi"
      subtitle="The classic couplet duel. Recite a sher; the AI answers with a real sher that begins with the letter yours ended on — then it's your turn to match its last letter."
      width="md"
    >
      <Card className="sticky top-16 z-10 !p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="text-center">
            <div className="text-xs uppercase tracking-widest text-[#94725a]">You</div>
            <div className="text-3xl font-bold tabular-nums text-[#3f7d3a]">{you}</div>
          </div>
          <div className="flex-1 text-center">
            <Swords className="mx-auto text-[#c26a3b]" size={22} />
            <div className="mt-1 text-sm text-[#5a3a28]">
              {required ? (
                <>Your sher must start with <strong className="text-[#8a3412]">{required}</strong></>
              ) : (
                "Open with any sher"
              )}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs uppercase tracking-widest text-[#94725a]">AI</div>
            <div className="text-3xl font-bold tabular-nums text-[#c26a3b]">{ai}</div>
          </div>
        </div>
      </Card>

      <div className="mt-6 space-y-4">
        {log.map((e, i) =>
          e.who === "you" ? (
            <div key={i} className="ml-auto max-w-[90%] rounded-2xl rounded-br-sm bg-[#fff8f0] border border-[#ecd6bd] p-4">
              <div className="text-xs text-[#94725a] mb-1">You</div>
              <p className="font-deva text-lg whitespace-pre-line">{e.turn.heard}</p>
              <p className="mt-2 text-sm text-[#5a3a28]">{e.turn.verdict}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className={`px-2 py-0.5 rounded-full ${e.turn.followsRule ? "bg-[#e6f2e4] text-[#24502a]" : "bg-[#fdecea] text-[#8a2a1a]"}`}>
                  starts with {e.turn.firstLetter} {e.turn.followsRule ? "✓" : "✗"}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#f6e2cf] text-[#5a321c]">ends with {e.turn.lastLetter}</span>
                {e.turn.poet && e.turn.poet !== "Unknown" && (
                  <span className="px-2 py-0.5 rounded-full bg-[#f6e2cf] text-[#5a321c]">{e.turn.poet}</span>
                )}
                <span className="px-2 py-0.5 rounded-full bg-[#3b2419] text-white">+{e.turn.points}</span>
              </div>
            </div>
          ) : (
            <div key={i} className="mr-auto max-w-[90%] rounded-2xl rounded-bl-sm bg-[#5a2e14] text-[#fff3e4] p-4">
              <div className="text-xs text-[#e9c9a8] mb-1">AI replies</div>
              <p className="font-deva text-lg whitespace-pre-line">{e.sher.devanagari}</p>
              <p className="mt-1 text-sm italic text-[#e9c9a8] whitespace-pre-line">{e.sher.roman}</p>
              <p className="mt-2 text-sm">— {e.sher.poet}</p>
              <p className="mt-1 text-xs text-[#e9c9a8]">{e.sher.meaning}</p>
              <div className="mt-2">
                <SpeakButton text={e.sher.devanagari} compact className="!text-[#fff3e4] hover:!bg-white/10" />
              </div>
            </div>
          ),
        )}
        <div ref={endRef} />
      </div>

      <Card className="mt-6 text-center">
        <MicButton
          size="lg"
          maxSeconds={30}
          busy={busy}
          label={log.length ? "Your turn — recite" : "Recite your opening sher"}
          busyLabel="The judge is listening…"
          onRecorded={(r: Recording) => play({ audio: r.base64, mimeType: r.mimeType })}
        />
        <form
          className="mt-5 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) void play({ text });
          }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="…or type your sher"
            className="flex-1 min-w-0 rounded-full border border-[#e2c9ad] bg-[#fffaf4] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c26a3b]/40"
          />
          <button
            type="submit"
            disabled={busy || !text.trim()}
            aria-label="Send"
            className="px-4 rounded-full bg-[#c26a3b] text-white disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </form>
        {error && <ErrorNote>{error}</ErrorNote>}
        {log.length > 0 && (
          <button
            type="button"
            onClick={reset}
            className="mt-4 inline-flex items-center gap-2 text-sm text-[#7d5b44] hover:text-[#3b2419]"
          >
            <RotateCcw size={14} /> New game
          </button>
        )}
        <p className="mt-4 text-[11px] text-[#b08a6a]">
          The AI opponent and judge can make mistakes about letters and attributions.
        </p>
      </Card>
    </Page>
  );
}
