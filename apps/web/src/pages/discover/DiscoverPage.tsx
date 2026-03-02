import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {api} from "../../config/api";

export default function DiscoverPage() {
  const [results, setResults] = useState<{devanagariText?: string; tashreeh?: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function searchMood(mood: string) {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch(api.moodSearch, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({mood}),
      });
      if (!res.ok) {
        throw new Error("Could not load moods. Please try again.");
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error("Unexpected response from server.");
      }
      setResults(data);
    } catch (err) {
      console.error("Mood search failed", err);
      setResults([]);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen px-4 py-8 flex justify-center bg-cover bg-no-repeat bg-top"
      style={{backgroundImage: "url('/images/background-lanterns.png')"}}
    >
      <div className="mt-12 w-full max-w-3xl rounded-2xl border border-[#e2c9ad] bg-[#fff7ef]/95 shadow-xl p-6 sm:p-8">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-4 inline-flex items-center gap-2 text-sm text-[#c26a3b] hover:text-[#a9552a]"
        >
          <span className="text-lg">←</span>
          <span>Back to Home</span>
        </button>
        <h1 className="text-3xl font-semibold text-[#3b2419] mb-2">
          Discover by Mood
        </h1>
        <p className="text-sm text-[#94725a] mb-6">
          Tap a mood to explore shers that feel like it.
        </p>

        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => searchMood("love")}
            className="px-4 py-2 rounded-xl bg-[#d94a7a] hover:bg-[#c03c69] text-white text-sm font-medium shadow-sm"
          >
            Love
          </button>
          <button
            onClick={() => searchMood("longing")}
            className="px-4 py-2 rounded-xl bg-[#3b6ed6] hover:bg-[#305cc0] text-white text-sm font-medium shadow-sm"
          >
            Longing
          </button>
          <button
            onClick={() => searchMood("rebellion")}
            className="px-4 py-2 rounded-xl bg-[#d7443b] hover:bg-[#c2362e] text-white text-sm font-medium shadow-sm"
          >
            Rebellion
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-[#e7b4b4] bg-[#ffecec] px-4 py-3 text-sm text-[#a13b3b]">
            {error}
          </div>
        )}

        {loading && (
          <p className="text-sm text-[#94725a] mb-4">Finding shers for this mood…</p>
        )}

        <div className="space-y-3">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              className="w-full text-left rounded-2xl border border-[#e2c9ad] bg-[#fdf3e8] hover:bg-[#f7ebde] px-4 py-3 text-[#3b2419] text-sm leading-relaxed shadow-sm"
              onClick={() =>
                navigate("/reader", {
                  state: {text: r.devanagariText, explanation: r.tashreeh},
                })
              }
            >
              {r.devanagariText || "Untitled sher"}
            </button>
          ))}

          {!loading && !error && results.length === 0 && (
            <p className="text-sm text-[#94725a]">
              No shers yet. Try picking a mood above.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
