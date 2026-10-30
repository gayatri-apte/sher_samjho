import { useState } from "react";
import Page, { ErrorNote } from "../../components/ui/Page";
import SherCard, { EmptyState, Skeleton } from "../../components/SherCard";
import { api } from "../../config/api";
import { apiJSON, type Sher } from "../../lib/http";

const MOODS = [
  { id: "love", label: "Ishq", sub: "love", emoji: "🌹" },
  { id: "longing", label: "Intezaar", sub: "longing", emoji: "🕯️" },
  { id: "sorrow", label: "Gham", sub: "sorrow", emoji: "🌧️" },
  { id: "wit", label: "Shokhi", sub: "wit", emoji: "✨" },
  { id: "spiritual", label: "Rooh", sub: "spiritual", emoji: "🌙" },
  { id: "philosophy", label: "Falsafa", sub: "philosophy", emoji: "🪶" },
  { id: "hope", label: "Umeed", sub: "hope", emoji: "🌅" },
  { id: "rebellion", label: "Inquilab", sub: "rebellion", emoji: "🔥" },
];

export default function DiscoverPage() {
  const [mood, setMood] = useState<string | null>(null);
  const [results, setResults] = useState<Sher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(id: string) {
    setMood(id);
    setLoading(true);
    setError(null);
    try {
      setResults(await apiJSON<Sher[]>(api.moodSearch, { body: { mood: id } }));
    } catch (e) {
      setResults([]);
      setError(e instanceof Error ? e.message : "Could not load this mood");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page title="Discover" subtitle="How are you feeling? Pick a mood and we'll find shers that feel like it.">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {MOODS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => pick(m.id)}
            aria-pressed={mood === m.id}
            className={`rounded-2xl border p-4 text-left transition-colors ${
              mood === m.id ? "bg-[#5a2e14] text-[#fff3e4] border-transparent" : "bg-[#fff8f0] border-[#ecd6bd] hover:bg-[#f6e2cf]"
            }`}
          >
            <span className="text-2xl" aria-hidden>{m.emoji}</span>
            <div className="mt-2 font-semibold">{m.label}</div>
            <div className={`text-xs ${mood === m.id ? "text-[#e9c9a8]" : "text-[#94725a]"}`}>{m.sub}</div>
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-3">
        {error && <ErrorNote>{error}</ErrorNote>}
        {loading && <Skeleton />}
        {!loading && mood && !error && results.length === 0 && (
          <EmptyState title="Nothing for this mood yet">Scan a few shers and they'll show up here.</EmptyState>
        )}
        {!loading && results.map((s) => <SherCard key={s.id} sher={s} />)}
      </div>
    </Page>
  );
}
