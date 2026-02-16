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
    return <p className="p-6 text-neutral-400">Loading history…</p>;
  }

  if (error) {
    return (
      <div className="p-6 text-red-400">
        Error loading history: {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="p-6 text-neutral-400">
        No scans yet. Scan poetry to build your history.
      </p>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] w-full overflow-x-hidden overflow-y-auto">
      <div className="p-6 max-w-4xl mx-auto space-y-4 w-full min-w-0 box-border">
        <h1 className="text-2xl font-semibold mb-4">Scan History</h1>

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
            className="p-4 rounded-lg bg-neutral-800 border border-neutral-700 cursor-pointer hover:border-blue-500 hover:bg-neutral-700 transition w-full min-w-0 overflow-hidden"
          >
            <p className="text-neutral-200 whitespace-pre-wrap line-clamp-4 break-words min-w-0">
              {item.text || item.cacheHash || item.id}
            </p>

            <div className="mt-2 text-sm text-neutral-400">
              {formatDate(item.createdAt)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
