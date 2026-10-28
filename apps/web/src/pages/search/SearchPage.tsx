import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {api} from "../../config/api";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query as fsQuery,
} from "firebase/firestore";
import {db} from "../../services/firebase";

type PopularSher = {
  id: string;
  poet?: string;
  text: string;
  comments: number;
  raw: any;
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [poetFilter, setPoetFilter] = useState("");
  const [eraFilter, setEraFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [popular, setPopular] = useState<PopularSher[]>([]);
  const [popularLoading, setPopularLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function loadPopular() {
      try {
        setPopularLoading(true);
        const q = fsQuery(
          collection(db, "global_poetry_cache"),
          orderBy("hitCount", "desc"),
          limit(6)
        );
        const snap = await getDocs(q);

        const items = await Promise.all(
          snap.docs.map(async (d) => {
            const data = d.data() as any;
            const id = d.id;
            const text = (data?.text ?? data?.devanagariText ?? "").toString();

            // comments count from subcollection
            const commentsSnap = await getDocs(
              collection(db, "global_poetry_cache", id, "comments")
            );

            const item: PopularSher = {
              id,
              poet: data?.poet ?? undefined,
              text,
              comments: commentsSnap.size,
              raw: data,
            };
            return item;
          })
        );

        if (!cancelled) {
          setPopular(items);
        }
      } catch (e) {
        console.error("Failed to load popular shers", e);
        if (!cancelled) {
          setPopular([]);
        }
      } finally {
        if (!cancelled) {
          setPopularLoading(false);
        }
      }
    }

    void loadPopular();
    return () => {
      cancelled = true;
    };
  }, []);

  async function search() {
    if (!query.trim()) return;
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

      const merged = [
        ...(Array.isArray(keywordRes) ? keywordRes : []),
        ...(Array.isArray(semanticRes) ? semanticRes : []),
      ];

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
    <div
      className="min-h-screen px-4 py-8 bg-cover bg-no-repeat bg-top"
      style={{backgroundImage: "url('/images/background-lanterns.png')"}}
    >
      <div className="max-w-3xl mx-auto mt-12 p-4 sm:p-8 bg-[#fff7ef]/95 rounded-2xl border border-[#e2c9ad] shadow">
        <button
        type="button"
        onClick={() => navigate("/")}
        className="mb-4 inline-flex items-center gap-2 text-sm text-[#c26a3b] hover:text-[#a9552a]"
      >
        <span className="text-lg">←</span>
        <span>Back to Home</span>
      </button>

      <p className="mb-3 text-sm text-[#7d5b44]">
        Remember a line but not the words?{" "}
        <button type="button" onClick={() => navigate("/find")} className="text-[#c26a3b] font-medium hover:underline">
          Say it out loud instead →
        </button>
      </p>
      <input
        onKeyDown={(e) => {
          if (e.key === "Enter" && query.trim()) void search();
        }}
        className="w-full p-3 bg-[#f6e2cf] text-[#3b2419] rounded border border-[#e2c9ad] placeholder:text-[#c39a79] text-sm"
        placeholder="Search by meaning…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <select
          value={poetFilter}
          onChange={(e) => setPoetFilter(e.target.value)}
          className="bg-[#f6e2cf] text-[#3b2419] p-2 rounded border border-[#e2c9ad] text-sm"
        >
          <option value="">All Poets</option>
          <option value="Mirza Ghalib">Mirza Ghalib</option>
          <option value="Mir Taqi Mir">Mir Taqi Mir</option>
          <option value="Faiz Ahmed Faiz">Faiz Ahmed Faiz</option>
        </select>

        <select
          value={eraFilter}
          onChange={(e) => setEraFilter(e.target.value)}
          className="bg-[#f6e2cf] text-[#3b2419] p-2 rounded border border-[#e2c9ad] text-sm"
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
        className="mt-4 px-4 py-2 bg-[#c26a3b] hover:bg-[#a9552a] text-white rounded disabled:opacity-50 text-sm"
      >
        {loading ? "Searching..." : "Search"}
      </button>

      {error && (
        <div className="mt-4 text-sm text-red-500">
          {error}
        </div>
      )}

      <div className="mt-8 space-y-4">
        {!loading && hasSearched && results.length === 0 && !error && (
          <div className="text-[#94725a] text-sm">
            No results found. Try a different word or filters.
          </div>
        )}
        {results.map((r: any, i: number) => (
          <div
            key={r.cacheHash ?? r.id ?? r.devanagariText ?? r.text ?? i}
            className="p-4 bg-[#fff7ef] border border-[#e2c9ad] rounded-xl cursor-pointer hover:bg-[#f6e2cf] transition-colors"
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
              <div className="text-sm text-[#94725a] mb-1">{r.poet}</div>
            )}
            <div className="text-[#3b2419] mb-2">
              {r.text ?? r.devanagariText}
            </div>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <p className="text-base font-semibold text-[#3b2419] mb-3">
          Most popular (by comments):
        </p>

        {popularLoading ? (
          <div className="text-sm text-[#94725a]">Loading popular shers…</div>
        ) : popular.filter((p) => p.comments > 0).length === 0 ? (
          <div className="text-sm text-[#94725a]">No popular shers yet.</div>
        ) : (
          <div className="space-y-4">
            {popular
              .filter((p) => p.comments > 0)
              .slice()
              .sort((a, b) => b.comments - a.comments)
              .map((p) => (
                <div
                  key={p.id}
                  className="p-4 bg-[#fff7ef] border border-[#e2c9ad] rounded-xl cursor-pointer hover:bg-[#f6e2cf] transition-colors"
                  onClick={() =>
                    navigate("/reader", {
                      state: {
                        text: p.raw?.text ?? p.raw?.devanagariText ?? p.text,
                        poet: p.poet ?? "",
                        explanation: p.raw?.tashreeh ?? p.raw?.explanation ?? "",
                        ocrConfidence: p.raw?.ocrConfidence,
                        attributionConfidence: p.raw?.attributionConfidence,
                        cacheHash: p.id,
                      },
                    })
                  }
                >
                  {p.poet && (
                    <div className="text-sm text-[#94725a] mb-1">{p.poet}</div>
                  )}
                  <div className="text-[#3b2419] mb-3 whitespace-pre-wrap">
                    {p.text}
                  </div>
                  <div className="flex items-center justify-end text-xs text-[#94725a]">
                    <span className="inline-flex items-center gap-1">
                      <span aria-hidden>💬</span>
                      <span>{p.comments} comments</span>
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>
      </div>
    </div>
  );
}
