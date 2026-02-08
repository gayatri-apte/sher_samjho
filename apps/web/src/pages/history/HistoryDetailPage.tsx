import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchScanById } from "../../services/functions.service";

type Scan = {
  devanagariText?: string;
  tashreeh?: string;
  text?: string;
  explanation?: string;
  createdAt?: { seconds?: number; nanoseconds?: number } | unknown;
};

function formatDate(createdAt: Scan["createdAt"]) {
  if (!createdAt) return "—";
  const c = createdAt as { seconds?: number };
  if (c?.seconds != null) {
    return new Date(c.seconds * 1000).toLocaleString();
  }
  return new Date(String(createdAt)).toLocaleString();
}

export default function HistoryDetailPage() {
  const { id: scanId } = useParams();
  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scanId) {
      setError("No scan id provided");
      setLoading(false);
      return;
    }

    fetchScanById(scanId)
      .then((data) => setScan(data as Scan))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load scan")
      )
      .finally(() => setLoading(false));
  }, [scanId]);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto w-full min-w-0 box-border">
        <h2 className="text-xl font-semibold mb-4">Saved Scan</h2>
        <p className="text-neutral-300">Loading scan …</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto w-full min-w-0 box-border">
        <h2 className="text-xl font-semibold mb-4">Saved Scan</h2>
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="p-6 max-w-4xl mx-auto w-full min-w-0 box-border">
        <h2 className="text-xl font-semibold mb-4">Saved Scan</h2>
        <p className="text-neutral-400">Scan not found.</p>
      </div>
    );
  }

  const devanagari = scan.devanagariText ?? scan.text ?? "";
  const tashreeh = scan.tashreeh ?? scan.explanation ?? "";

  return (
    <div className="min-h-[calc(100vh-64px)] w-full overflow-x-hidden overflow-y-auto">
      <div className="p-6 max-w-4xl mx-auto space-y-4 w-full min-w-0 box-border">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="text-2xl font-semibold shrink-0">Saved Scan</h2>
          <p className="text-sm text-neutral-500 shrink-0">
            {formatDate(scan.createdAt)}
          </p>
        </div>

        <div
          className="w-full min-w-0 rounded-xl border border-neutral-700/50 bg-neutral-800/40 p-6 text-lg leading-relaxed text-neutral-100 text-right whitespace-pre-wrap break-words overflow-hidden"
          style={{ fontFamily: "Noto Sans Devanagari, sans-serif" }}
        >
          {devanagari || (
            <span className="text-neutral-400">
              No text saved for this scan.
            </span>
          )}
        </div>

        <div className="mt-4 w-full min-w-0 text-neutral-300 whitespace-pre-wrap break-words overflow-hidden">
          {tashreeh}
        </div>
      </div>
    </div>
  );
}
