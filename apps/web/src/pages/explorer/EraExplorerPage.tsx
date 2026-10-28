import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Page, { Card, ErrorNote } from "../../components/ui/Page";
import { api } from "../../config/api";
import { apiJSON, sherState, type Sher } from "../../lib/http";

// Must match the era labels written by functions/src/utils/poetMeta.ts
const ERAS = [
  { value: "18th Century", label: "18th century", note: "Mir Taqi Mir and the Delhi masters" },
  { value: "Mughal Era", label: "Late Mughal", note: "Ghalib and the twilight of Delhi" },
  { value: "Progressive", label: "Progressive", note: "Faiz and the Progressive Writers" },
];

export default function EraExplorerPage() {
  const navigate = useNavigate();
  const [era, setEra] = useState<string | null>(null);
  const [results, setResults] = useState<Sher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function searchEra(value: string) {
    setEra(value);
    setLoading(true);
    setError(null);
    try {
      setResults(await apiJSON<Sher[]>(api.eraSearch, { body: { era: value } }));
    } catch (e) {
      setResults([]);
      setError(e instanceof Error ? e.message : "Era search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page title="Eras of the ghazal" subtitle="Walk through Urdu poetry by period.">
      <div className="grid gap-3 sm:grid-cols-3">
        {ERAS.map((e) => (
          <button
            key={e.value}
            type="button"
            onClick={() => searchEra(e.value)}
            aria-pressed={era === e.value}
            className={`text-left rounded-2xl border p-4 transition-colors ${
              era === e.value ? "bg-[#5a2e14] text-[#fff3e4] border-transparent" : "bg-[#fff8f0] border-[#ecd6bd] hover:bg-[#f6e2cf]"
            }`}
          >
            <div className="font-semibold">{e.label}</div>
            <div className={`text-xs mt-1 ${era === e.value ? "text-[#e9c9a8]" : "text-[#94725a]"}`}>{e.note}</div>
          </button>
        ))}
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}
      {loading && <p className="mt-6 text-[#94725a]">Loading…</p>}
      {!loading && era && results.length === 0 && !error && (
        <p className="mt-6 text-[#94725a]">No shers saved from this era yet.</p>
      )}

      <div className="mt-6 space-y-3">
        {results.map((r) => (
          <Card key={r.id} className="!p-4 cursor-pointer hover:bg-[#f6e2cf]">
            <button type="button" className="w-full text-left" onClick={() => navigate(`/poetry-ai/${r.id}`, { state: sherState(r) })}>
              {r.poet && <div className="text-xs text-[#94725a] mb-1">{r.poet}</div>}
              <div className="font-deva text-lg whitespace-pre-line">{r.devanagariText}</div>
            </button>
          </Card>
        ))}
      </div>
    </Page>
  );
}
