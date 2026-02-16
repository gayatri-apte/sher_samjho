import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {api} from "../../config/api";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [poetFilter, setPoetFilter] = useState("");
  const [eraFilter, setEraFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
   const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();

  async function search() {
    setLoading(true);
    setError(null);
    try {
      const [keywordRes, semanticRes] = await Promise.all([
        fetch(api.keywordSearch, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({query}),
        }).then((r) => r.json()),

        fetch(api.search, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({query}),
        }).then((r) => r.json()),
      ]);

      const merged = [...keywordRes, ...semanticRes];

      const unique = Array.from(
        new Map(
          merged.map((item: { devanagariText?: string }) => [
            item.devanagariText,
            item,
          ])
        ).values()
      );

      const filtered = unique.filter((item: any) => {
        const passesPoet = poetFilter ? item.poet === poetFilter : true;
        const passesEra = eraFilter ? item.era === eraFilter : true;

        return passesPoet && passesEra;
      });

      setResults(filtered);
      setHasSearched(true);
    } catch (e: any) {
      console.error("Search failed", e);
      setError(e?.message ?? "Search failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <input
        className="w-full p-3 bg-neutral-900 text-white rounded"
        placeholder="Search by meaning…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <select
          value={poetFilter}
          onChange={(e) => setPoetFilter(e.target.value)}
          className="bg-neutral-800 p-2 rounded mr-4"
        >
          <option value="">All Poets</option>
          <option value="Mirza Ghalib">Mirza Ghalib</option>
          <option value="Mir Taqi Mir">Mir Taqi Mir</option>
          <option value="Faiz Ahmed Faiz">Faiz Ahmed Faiz</option>
        </select>

        <select
          value={eraFilter}
          onChange={(e) => setEraFilter(e.target.value)}
          className="bg-neutral-800 p-2 rounded"
        >
          <option value="">All Eras</option>
          <option value="Mughal Era">Mughal Era</option>
          <option value="18th Century">18th Century</option>
          <option value="Progressive">Progressive</option>
        </select>
      </div>

      <button
        onClick={search}
        disabled={loading}
        className="mt-4 px-4 py-2 bg-blue-600 rounded disabled:opacity-50"
      >
        {loading ? "Searching..." : "Search"}
      </button>

      {error && (
        <div className="mt-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {!loading && hasSearched && results.length === 0 && !error && (
          <div className="text-neutral-400 text-sm">
            No results found. Try a different word or filters.
          </div>
        )}
        {results.map((r, i) => (
          <div
            key={i}
            className="p-4 bg-neutral-800 rounded cursor-pointer"
            onClick={() =>
              navigate("/reader", {
                state: {
                  text: r.text ?? r.devanagariText,
                  poet: r.poet ?? "",
                  explanation: r.tashreeh ?? r.explanation ?? "",
                  ocrConfidence: r.ocrConfidence,
                  attributionConfidence: r.attributionConfidence,
                  cacheHash: r.cacheHash ?? r.id,
                },
              })
            }
          >
            {r.poet && (
              <div className="text-sm text-neutral-400 mb-1">
                {r.poet}
              </div>
            )}
            <div>{r.text ?? r.devanagariText}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
