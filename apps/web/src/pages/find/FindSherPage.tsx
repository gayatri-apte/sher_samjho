import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Mic2, BookOpen } from "lucide-react";
import Page, { Card, ErrorNote } from "../../components/ui/Page";
import MicButton from "../../components/voice/MicButton";
import SpeakButton from "../../components/voice/SpeakButton";
import { api } from "../../config/api";
import { apiJSON, sherState, tashreehText, type Sher } from "../../lib/http";
import type { Recording } from "../../lib/audio/useVoiceRecorder";

type FindResult = {
  heard: string;
  identified: {
    devanagari: string;
    roman: string;
    poet: string;
    meaning: string;
    confidence: number;
  } | null;
  matches: Sher[];
};

export default function FindSherPage() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [res, setRes] = useState<FindResult | null>(null);

  async function run(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    setRes(null);
    try {
      setRes(await apiJSON<FindResult>(api.findSher, { body }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page
      title="Ek sher tha…"
      subtitle="Remember only half a line? Say it out loud — in Hindi, Urdu or broken Hinglish — and we'll find the full sher, the poet and the meaning."
      width="md"
    >
      <Card className="text-center">
        <MicButton
          size="lg"
          maxSeconds={20}
          busy={busy}
          label="Tap and say what you remember"
          busyLabel="Searching the diwan…"
          onRecorded={(r: Recording) => run({ audio: r.base64, mimeType: r.mimeType })}
        />
        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-[#b08a6a]">
          <div className="h-px flex-1 bg-[#ecd6bd]" /> or type <div className="h-px flex-1 bg-[#ecd6bd]" />
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) void run({ text });
          }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. hazaaron khwahishen aisi…"
            className="flex-1 min-w-0 rounded-full border border-[#e2c9ad] bg-[#fffaf4] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c26a3b]/40"
          />
          <button
            type="submit"
            disabled={busy || !text.trim()}
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#c26a3b] text-white text-sm font-medium disabled:opacity-50"
          >
            <Search size={16} /> Find
          </button>
        </form>
        {error && <ErrorNote>{error}</ErrorNote>}
      </Card>

      {res && (
        <div className="mt-6 space-y-6">
          {res.heard && (
            <p className="text-sm text-[#7d5b44]">
              We heard: <span className="font-deva text-[#3b2419]">“{res.heard}”</span>
            </p>
          )}

          {res.identified ? (
            <Card>
              <span className="text-xs uppercase tracking-[0.25em] text-[#b08a6a]">
                Found it · {Math.round(res.identified.confidence * 100)}% sure
              </span>
              <p lang="hi" className="mt-4 font-deva text-2xl sm:text-3xl leading-relaxed text-center whitespace-pre-line">
                {res.identified.devanagari}
              </p>
              <p className="mt-2 text-center italic text-[#7d5b44] whitespace-pre-line">
                {res.identified.roman}
              </p>
              <p className="mt-3 text-center text-[#94725a]">— {res.identified.poet}</p>
              <p className="mt-4 text-[#5a3a28]">{res.identified.meaning}</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <SpeakButton text={res.identified.devanagari} label="Listen" />
                <button
                  type="button"
                  onClick={() =>
                    navigate("/ustad", {
                      state: {
                        referenceText: res.identified!.devanagari,
                        roman: res.identified!.roman,
                        poet: res.identified!.poet,
                      },
                    })
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#c26a3b] text-white text-sm font-medium hover:bg-[#a9552a]"
                >
                  <Mic2 size={16} /> Practice reciting with Ustad
                </button>
              </div>
              <p className="mt-4 text-[11px] text-center text-[#b08a6a]">
                AI identification — double-check the attribution before quoting.
              </p>
            </Card>
          ) : (
            <Card>
              <p className="text-[#7d5b44]">
                We couldn't confidently name this sher. Here are the closest ones in Sher Samjho's collection.
              </p>
            </Card>
          )}

          {res.matches.length > 0 && (
            <div>
              <h2 className="mb-3 font-semibold text-[#5a2e14]">From the Sher Samjho collection</h2>
              <div className="space-y-3">
                {res.matches.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => navigate(`/poetry-ai/${m.id}`, { state: sherState(m) })}
                    className="w-full text-left rounded-2xl border border-[#ecd6bd] bg-[#fff8f0] p-4 hover:bg-[#f6e2cf] transition-colors"
                  >
                    {m.poet && <div className="text-xs text-[#94725a] mb-1">{m.poet}</div>}
                    <div className="font-deva text-lg whitespace-pre-line text-[#3b2419]">{m.devanagariText}</div>
                    {tashreehText(m.tashreeh) && (
                      <div className="mt-2 text-sm text-[#7d5b44] line-clamp-2">{tashreehText(m.tashreeh)}</div>
                    )}
                    <div className="mt-2 inline-flex items-center gap-1 text-xs text-[#c26a3b]">
                      <BookOpen size={12} /> Open & ask AI
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Page>
  );
}
