import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-4 inline-flex items-center gap-2 text-sm text-[#c26a3b] hover:text-[#a9552a]"
        >
          <span className="text-lg">←</span>
          <span>Back to Home</span>
        </button>
        <h2 className="text-xl font-semibold mb-4 text-[#3b2419]">Saved Scan</h2>
        <p className="text-[#94725a]">Loading scan …</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto w-full min-w-0 box-border">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-4 inline-flex items-center gap-2 text-sm text-[#c26a3b] hover:text-[#a9552a]"
        >
          <span className="text-lg">←</span>
          <span>Back to Home</span>
        </button>
        <h2 className="text-xl font-semibold mb-4 text-[#3b2419]">Saved Scan</h2>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="p-6 max-w-4xl mx-auto w-full min-w-0 box-border">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-4 inline-flex items-center gap-2 text-sm text-[#c26a3b] hover:text-[#a9552a]"
        >
          <span className="text-lg">←</span>
          <span>Back to Home</span>
        </button>
        <h2 className="text-xl font-semibold mb-4 text-[#3b2419]">Saved Scan</h2>
        <p className="text-[#94725a]">Scan not found.</p>
      </div>
    );
  }

  const devanagari = scan.devanagariText ?? scan.text ?? "";
  const tashreeh = scan.tashreeh ?? scan.explanation ?? "";

  return (
    <div className="min-h-[calc(100vh-64px)] w-full overflow-x-hidden overflow-y-auto">
      <div className="p-6 max-w-4xl mx-auto space-y-4 w-full min-w-0 box-border">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-4 inline-flex items-center gap-2 text-sm text-[#c26a3b] hover:text-[#a9552a]"
        >
          <span className="text-lg">←</span>
          <span>Back to Home</span>
        </button>
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="text-2xl font-semibold shrink-0 text-[#3b2419]">Saved Scan</h2>
          <p className="text-sm text-[#94725a] shrink-0">
            {formatDate(scan.createdAt)}
          </p>
        </div>

        <div
          className="w-full min-w-0 rounded-xl border border-[#e2c9ad] bg-[#fff7ef] p-6 text-lg leading-relaxed text-[#3b2419] text-right whitespace-pre-wrap break-words overflow-hidden"
          style={{ fontFamily: "Noto Sans Devanagari, sans-serif" }}
        >
          {devanagari || (
            <span className="text-[#94725a]">
              No text saved for this scan.
            </span>
          )}
        </div>

        <div className="mt-4 w-full min-w-0 text-[#5a3a28] whitespace-pre-wrap break-words overflow-hidden">
          {tashreeh}
        </div>
      </div>
    </div>
  );
}
