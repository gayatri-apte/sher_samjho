import {useEffect, useState} from "react";
import {api} from "../config/api";

type Recitation = {
  id: string;
  poet?: string;
  era?: string;
  audioUrl: string;
  reciterName?: string;
  source?: string;
};

export default function OfficialRecitations({sherId}: {sherId: string}) {
  const [recitations, setRecitations] = useState<Recitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchList() {
      try {
        const res = await fetch(api.officialRecitations(sherId));
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) setError(data?.error ?? "Failed to load");
          return;
        }
        if (!cancelled) setRecitations(data.recitations ?? []);
      } catch {
        if (!cancelled) setError("Could not load recitations");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchList();
    return () => {
      cancelled = true;
    };
  }, [sherId]);

  if (loading) {
    return (
      <div className="mt-4 text-sm text-[#94725a]">
        Loading famous recitations…
      </div>
    );
  }

  // No famous recitations is the normal case — stay quiet instead of erroring.
  if (error || recitations.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium text-[#3b2419] mb-2">
        Famous recitations
      </h3>
      <ul className="space-y-3">
        {recitations.map((r) => (
          <li
            key={r.id}
            className="flex flex-wrap items-center gap-3 p-3 bg-[#fff3e4] rounded-xl border border-[#ecd6bd]"
          >
            <audio
              src={r.audioUrl}
              controls
              className="flex-1 min-w-0 h-9"
              preload="metadata"
            />
            <div className="text-sm text-[#7d5b44]">
              {r.reciterName && <span>{r.reciterName}</span>}
              {r.era && (
                <span className="ml-2 text-[#94725a]">
                  {r.era}
                </span>
              )}
              {r.source && (
                <span className="ml-2 text-[#94725a]">
                  · {r.source}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
