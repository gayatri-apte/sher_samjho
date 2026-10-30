import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon, Mic } from "lucide-react";
import Page, { ErrorNote } from "../../components/ui/Page";
import SherCard, { EmptyState, Skeleton } from "../../components/SherCard";
import { api } from "../../config/api";
import { apiJSON, type Sher } from "../../lib/http";

const SUGGESTIONS = ["dard", "intezaar", "ishq", "ख़्वाहिश", "loneliness", "hope", "dil"];
const POETS = ["Mirza Ghalib", "Mir Taqi Mir", "Bahadur Shah Zafar", "Daagh Dehlvi", "Allama Iqbal"];

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [poet, setPoet] = useState("");
  const [results, setResults] = useState<Sher[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(q = query) {
    const term = q.trim();
    if (!term) return;
    setQuery(term);
    setLoading(true);
    setError(null);
    // Words (exact, any script) + meaning (AI embeddings) in parallel.
    const [kw, sem] = await Promise.allSettled([
      apiJSON<Sher[]>(api.keywordSearch, { body: { query: term } }),
      apiJSON<Sher[]>(api.search, { body: { query: term, limit: 10 } }),
    ]);
    const merged = new Map<string, Sher>();
    for (const r of [kw, sem]) {
      if (r.status === "fulfilled" && Array.isArray(r.value)) {
        for (const s of r.value) if (!merged.has(s.id)) merged.set(s.id, s);
      }
    }
    if (merged.size === 0 && sem.status === "rejected") {
      setError(sem.reason instanceof Error ? sem.reason.message : "Search failed");
    }
    setResults([...merged.values()]);
    setLoading(false);
  }

  const shown = (results ?? []).filter((r) => !poet || r.poet === poet);

  return (
    <Page title="Search" subtitle="Find a sher by a word you remember — in Hindi, Urdu or Roman — or by what it means.">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
        className="flex gap-2"
        role="search"
      >
        <div className="relative flex-1 min-w-0">
          <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b08a6a]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. dard, ख़्वाहिश, or “poems about waiting”"
            aria-label="Search poetry"
            className="w-full rounded-full border border-[#e2c9ad] bg-[#fffaf4] pl-11 pr-4 py-3 text-[#3b2419] placeholder:text-[#c39a79] focus:outline-none focus:ring-2 focus:ring-[#c26a3b]/40"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="shrink-0 px-6 rounded-full bg-[#c26a3b] text-white font-medium hover:bg-[#a9552a] disabled:opacity-50"
        >
          Search
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => search(s)}
            className="px-3 py-1 rounded-full text-sm bg-[#f6e2cf] text-[#5a321c] hover:bg-[#ecd0b4]"
          >
            {s}
          </button>
        ))}
        <button
          type="button"
          onClick={() => navigate("/find")}
          className="ml-auto inline-flex items-center gap-1.5 text-sm text-[#a9552a] hover:underline"
        >
          <Mic size={14} /> Remember a line? Say it instead
        </button>
      </div>

      {results && results.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter by poet">
          {["", ...POETS].map((p) => (
            <button
              key={p || "all"}
              type="button"
              onClick={() => setPoet(p)}
              aria-pressed={poet === p}
              className={`px-3 py-1 rounded-full text-xs border ${
                poet === p ? "bg-[#5a2e14] text-white border-transparent" : "border-[#e2c9ad] text-[#5a321c] hover:bg-[#f6e2cf]"
              }`}
            >
              {p || "All poets"}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 space-y-3">
        {error && <ErrorNote>{error}</ErrorNote>}
        {loading && <Skeleton />}
        {!loading && results && shown.length === 0 && !error && (
          <EmptyState title="No shers found">
            Try another word, a theme in English (“separation”, “hope”), or{" "}
            <button type="button" onClick={() => navigate("/scan")} className="underline">scan one</button>.
          </EmptyState>
        )}
        {!loading && shown.map((s) => <SherCard key={s.id} sher={s} />)}
      </div>
    </Page>
  );
}
