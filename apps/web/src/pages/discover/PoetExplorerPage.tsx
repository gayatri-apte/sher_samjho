import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {api} from "../../config/api";

export default function PoetExplorerPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function searchByPoet(poet: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(api.search, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({query: poet}),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Search failed");
      }

      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("Poet search failed:", err);
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl mb-4">Poet Explorer</h1>
      <p className="text-sm text-neutral-400 mb-6">
        Browse poetry by poet. Uses saved metadata from your scans.
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => searchByPoet("Mirza Ghalib")}
          className="bg-neutral-800 px-4 py-2 rounded"
          disabled={loading}
        >
          Mirza Ghalib
        </button>
        <button
          onClick={() => searchByPoet("Mir Taqi Mir")}
          className="bg-neutral-800 px-4 py-2 rounded"
          disabled={loading}
        >
          Mir Taqi Mir
        </button>
        <button
          onClick={() => searchByPoet("Faiz Ahmed Faiz")}
          className="bg-neutral-800 px-4 py-2 rounded"
          disabled={loading}
        >
          Faiz Ahmed Faiz
        </button>
      </div>

      {error && (
        <div className="text-red-400 mb-4 text-sm">
          {error}
        </div>
      )}

      {results.length === 0 && !loading && (
        <div className="text-neutral-500 mt-6">
          No poetry found for this poet yet.
        </div>
      )}

      <div className="space-y-4">
        {results.map((r, i) => (
          <div
            key={i}
            className="p-4 bg-neutral-900 rounded cursor-pointer"
            onClick={() =>
              navigate("/reader", {
                state: {
                  text: r.devanagariText,
                  poet: r.poet ?? "",
                },
              })
            }
          >
            <div className="text-sm text-neutral-400 mb-1">
              {r.poet || "Unknown poet"}
              {r.era ? ` • ${r.era}` : null}
            </div>
            <div>{r.devanagariText}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

