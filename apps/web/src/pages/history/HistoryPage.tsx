import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Page, { ErrorNote } from "../../components/ui/Page";
import SherCard, { EmptyState, Skeleton } from "../../components/SherCard";
import { fetchHistory } from "../../services/functions.service";
import type { Sher } from "../../lib/http";

type Item = {
  id: string;
  cacheHash?: string;
  text?: string;
  devanagariText?: string;
  tashreeh?: unknown;
  explanation?: string;
  poet?: string;
  createdAt?: { seconds?: number };
};

function day(ts?: { seconds?: number }) {
  if (!ts?.seconds) return "Earlier";
  return new Date(ts.seconds * 1000).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}

export default function HistoryPage() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory()
      .then((list) => setItems(list as Item[]))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load history"));
  }, []);

  // group by day
  const groups = new Map<string, Item[]>();
  for (const it of items ?? []) {
    const k = day(it.createdAt);
    groups.set(k, [...(groups.get(k) ?? []), it]);
  }

  return (
    <Page title="History" subtitle="Every sher you've scanned and saved.">
      {error && <ErrorNote>{error}</ErrorNote>}
      {!items && !error && <Skeleton />}
      {items && items.length === 0 && (
        <EmptyState title="Nothing saved yet">
          <Link to="/scan" className="underline">Scan a sher</Link> and tap “Save to history”.
        </EmptyState>
      )}
      {[...groups.entries()].map(([d, list]) => (
        <section key={d} className="mb-8">
          <h2 className="mb-3 text-xs uppercase tracking-[0.25em] text-[#b08a6a]">{d}</h2>
          <div className="space-y-3">
            {list.map((it) => {
              const sher: Sher = {
                id: it.cacheHash || it.id,
                devanagariText: it.devanagariText ?? it.text,
                tashreeh: it.tashreeh ?? it.explanation,
                poet: it.poet,
              };
              return <SherCard key={it.id} sher={sher} />;
            })}
          </div>
        </section>
      ))}
    </Page>
  );
}
