import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchHistory } from "../../services/functions.service";

type HistoryItem = {
  id: string;
  text?: string;
  devanagariText?: string;
  cacheHash?: string;
  createdAt: any;
  explanation?: string;
  tashreeh?: string;
  poet?: string;
  ocrConfidence?: number;
  attributionConfidence?: number;
};

function formatDate(createdAt: any) {
  if (!createdAt) return "—";

  if (createdAt?.seconds) {
    return new Date(createdAt.seconds * 1000).toLocaleString();
  }

  return new Date(createdAt).toLocaleString();
}

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory()
      .then(setItems)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load history")
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div
        className="min-h-screen p-6 bg-cover bg-no-repeat bg-center"
        style={{backgroundImage: "url('/images/background-pattern-soft.png')"}}
      >
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-4 inline-flex items-center gap-2 text-sm text-[#c26a3b] hover:text-[#a9552a]"
        >
          <span className="text-lg">←</span>
          <span>Back to Home</span>
        </button>
        <p className="text-[#94725a]">Loading history…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen p-6 bg-cover bg-no-repeat bg-center"
        style={{backgroundImage: "url('/images/background-pattern-soft.png')"}}
      >
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-4 inline-flex items-center gap-2 text-sm text-[#c26a3b] hover:text-[#a9552a]"
        >
          <span className="text-lg">←</span>
          <span>Back to Home</span>
        </button>
        <p className="text-red-500">Error loading history: {error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className="min-h-screen p-6 bg-cover bg-no-repeat bg-center"
        style={{backgroundImage: "url('/images/background-pattern-soft.png')"}}
      >
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-4 inline-flex items-center gap-2 text-sm text-[#c26a3b] hover:text-[#a9552a]"
        >
          <span className="text-lg">←</span>
          <span>Back to Home</span>
        </button>
        <p className="text-[#94725a]">
          No scans yet. Scan poetry to build your history.
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden overflow-y-auto bg-cover bg-no-repeat bg-center"
      style={{backgroundImage: "url('/images/background-pattern-soft.png')"}}
    >
      <div className="p-6 max-w-4xl mx-auto space-y-4 w-full min-w-0 box-border">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-4 inline-flex items-center gap-2 text-sm text-[#c26a3b] hover:text-[#a9552a]"
        >
          <span className="text-lg">←</span>
          <span>Back to Home</span>
        </button>
        <h1 className="text-2xl font-semibold mb-4 text-[#3b2419]">Scan History</h1>

        {items.map((item) => (
          <div
            key={item.id}
            onClick={() =>
              navigate("/reader", {
                state: {
                  text: item.devanagariText ?? item.text ?? "",
                  poet: item.poet ?? "",
                  explanation: item.explanation ?? item.tashreeh ?? "",
                  ocrConfidence: item.ocrConfidence,
                  attributionConfidence: item.attributionConfidence,
                  cacheHash: item.cacheHash,
                },
              })
            }
            className="p-4 rounded-xl bg-[#fff7ef] border border-[#e2c9ad] cursor-pointer hover:border-[#c26a3b] hover:bg-[#f6e2cf] transition w-full min-w-0 overflow-hidden"
          >
            <p className="text-[#3b2419] whitespace-pre-wrap line-clamp-4 break-words min-w-0">
              {item.text || item.cacheHash || item.id}
            </p>

            <div className="mt-2 text-sm text-[#94725a]">
              {formatDate(item.createdAt)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
