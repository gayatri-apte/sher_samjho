import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../config/api";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const navigate = useNavigate();

  async function search() {
    const res = await fetch(api.search, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    setResults(await res.json());
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <input
        className="w-full p-3 bg-neutral-900 text-white rounded"
        placeholder="Search by meaning…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <button
        onClick={search}
        className="mt-4 px-4 py-2 bg-blue-600 rounded"
      >
        Search
      </button>

      <div className="mt-6 space-y-4">
        {results.map((r, i) => (
          <div
            key={i}
            className="p-4 bg-neutral-800 rounded cursor-pointer"
            onClick={() =>
              navigate("/reader", {
                state: { text: r.devanagariText },
              })
            }
          >
            {r.devanagariText}
          </div>
        ))}
      </div>
    </div>
  );
}
