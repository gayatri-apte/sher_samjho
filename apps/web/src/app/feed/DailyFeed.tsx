import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic2, Shuffle, Sparkles } from "lucide-react";
import Page, { Card, ErrorNote } from "../../components/ui/Page";
import SpeakButton from "../../components/voice/SpeakButton";
import { api } from "../../config/api";
import { apiJSON, sherState, tashreehText, type Sher } from "../../lib/http";

/**
 * Sher of the day — the same for everyone on a given date (it used to be a
 * random pick after downloading the entire collection, embeddings included).
 */
export default function DailyFeed() {
  const navigate = useNavigate();
  const [sher, setSher] = useState<(Sher & { date?: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isToday, setIsToday] = useState(true);

  const load = useCallback(async (random: boolean) => {
    setLoading(true);
    setError(null);
    try {
      setSher(await apiJSON<Sher | null>(`${api.dailySher}${random ? "?random=1" : ""}`));
      setIsToday(!random);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load today's sher");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    apiJSON<Sher | null>(api.dailySher)
      .then(setSher)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load today's sher"))
      .finally(() => setLoading(false));
  }, []);

  const meaning = tashreehText(sher?.tashreeh);

  return (
    <Page title={isToday ? "Aaj ka sher" : "Ek aur sher"} subtitle="One sher a day — listen, understand, recite." width="md">
      {error && <ErrorNote>{error}</ErrorNote>}
      {loading ? (
        <p className="text-[#94725a]">Loading…</p>
      ) : !sher ? (
        <Card>
          <p className="text-[#7d5b44]">No poetry yet. Use <strong>Scan</strong> to add the first sher to the collection.</p>
        </Card>
      ) : (
        <Card>
          {sher.date && isToday && (
            <p className="text-xs uppercase tracking-[0.25em] text-[#b08a6a] mb-4">
              {new Date(sher.date).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
            </p>
          )}
          <p lang="hi" className="font-deva text-2xl sm:text-3xl leading-relaxed text-center whitespace-pre-line text-[#3b2419]">
            {sher.devanagariText}
          </p>
          {sher.poet && sher.poet !== "Unknown" && <p className="mt-4 text-center text-[#94725a]">— {sher.poet}</p>}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <SpeakButton text={sher.devanagariText ?? ""} label="Listen" />
            <button
              type="button"
              onClick={() => navigate(`/ustad/${sher.id}`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#c26a3b] text-white text-sm font-medium hover:bg-[#a9552a]"
            >
              <Mic2 size={16} /> Recite it
            </button>
            <button
              type="button"
              onClick={() => navigate(`/poetry-ai/${sher.id}`, { state: sherState(sher) })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#e2c9ad] text-sm text-[#5a321c] hover:bg-[#f6e2cf]"
            >
              <Sparkles size={16} /> Meaning & discussion
            </button>
          </div>

          {meaning && (
            <details className="mt-6 rounded-2xl bg-[#fbeee0] px-4 py-3">
              <summary className="cursor-pointer text-sm font-medium text-[#5a2e14]">Tashreeh</summary>
              <p lang="hi" className="mt-2 font-deva leading-relaxed text-[#5a3a28] whitespace-pre-wrap">{meaning}</p>
            </details>
          )}

          <button
            type="button"
            onClick={() => load(true)}
            className="mt-6 mx-auto flex items-center gap-2 text-sm text-[#7d5b44] hover:text-[#3b2419]"
          >
            <Shuffle size={14} /> Another sher
          </button>
        </Card>
      )}
    </Page>
  );
}
