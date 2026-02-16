import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../config/api";

export default function DiscoverPage() {
  const [results, setResults] = useState<{ devanagariText?: string; tashreeh?: string }[]>([]);
  const navigate = useNavigate();

  async function searchMood(mood: string) {
    const res = await fetch(api.moodSearch, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mood }),
    });
    setResults(await res.json());
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl mb-4">Discover by Mood</h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => searchMood("love")}
          className="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded"
        >
          Love
        </button>
        <button
          onClick={() => searchMood("longing")}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
        >
          Longing
        </button>
        <button
          onClick={() => searchMood("rebellion")}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
        >
          Rebellion
        </button>
      </div>

      <div className="space-y-4">
        {results.map((r, i) => (
          <div
            key={i}
            className="mb-4 p-4 bg-neutral-800 rounded cursor-pointer hover:bg-neutral-700"
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
