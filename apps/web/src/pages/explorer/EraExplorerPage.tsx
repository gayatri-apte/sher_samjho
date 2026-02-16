import {useState} from "react";

export default function EraExplorerPage() {
  const [results, setResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  async function searchEra(era: string) {
    console.log("Clicked era:", era);

    const res = await fetch(
      `${import.meta.env.VITE_API_BASE}/search/era`,
      {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({era}),
      }
    );

    const data = await res.json();
    console.log("API Response:", data);

    setResults(data);
    setHasSearched(true);
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-6">Era Explorer</h1>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => searchEra("18th Century")}
          className="bg-neutral-800 px-4 py-2 rounded"
        >
          18th Century
        </button>

        <button
          onClick={() => searchEra("Mughal Era")}
          className="bg-neutral-800 px-4 py-2 rounded"
        >
          Mughal Era
        </button>

        <button
          onClick={() => searchEra("Progressive Movement")}
          className="bg-neutral-800 px-4 py-2 rounded"
        >
          Progressive
        </button>
      </div>

      {hasSearched && results.length === 0 && (
        <div className="text-neutral-500 mt-6">
          No poetry found for this era.
        </div>
      )}

      {results.map((r, i) => (
        <div key={i} className="mb-4 p-4 bg-neutral-900 rounded">
          <div className="text-sm text-neutral-400">
            {r.poet} • {r.era}
          </div>
          <div className="mt-2">{r.devanagariText}</div>
        </div>
      ))}
    </div>
  );
}

