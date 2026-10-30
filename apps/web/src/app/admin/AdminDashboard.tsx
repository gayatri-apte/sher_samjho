import { useEffect, useState } from "react";
import { Library } from "lucide-react";
import Page, { Card, ErrorNote } from "../../components/ui/Page";
import { Skeleton } from "../../components/SherCard";
import { api } from "../../config/api";
import { apiJSON } from "../../lib/http";

type Analytics = Record<string, number>;

const LABELS: [string, string][] = [
  ["totalUsers", "Users"],
  ["totalShers", "Shers in library"],
  ["totalScans", "Scans"],
  ["totalRecitations", "Recitations"],
  ["totalVoiceSearches", "Voice searches"],
  ["totalBaitBaziTurns", "Bait-bazi turns"],
  ["totalReviews", "Word reviews"],
  ["totalAIQueries", "AI questions"],
  ["aiFailures", "AI failures"],
];

export default function AdminDashboard() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seedMsg, setSeedMsg] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const load = () =>
    apiJSON<Analytics>(api.adminAnalytics, { requireAuth: true })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));

  useEffect(() => {
    void load();
  }, []);

  async function seed() {
    setSeeding(true);
    setSeedMsg("Loading classic shers (meaning + explanations for each)…");
    try {
      // The server adds 5 per call; keep going until none remain.
      for (let i = 0; i < 10; i++) {
        const r = await apiJSON<{ added: number; remaining: number; total: number }>(api.seed, {
          method: "POST",
          body: {},
          requireAuth: true,
          timeoutMs: 200_000,
        });
        setSeedMsg(`Library: ${r.total - r.remaining}/${r.total} classic shers loaded…`);
        if (r.remaining === 0) break;
      }
      setSeedMsg("Classic library ready ✓ — Search, Eras, Poets and Aaj ka sher now have content.");
      void load();
    } catch (e) {
      setSeedMsg(e instanceof Error ? e.message : "Seeding failed");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <Page title="Admin" subtitle="Usage across Sher Samjho.">
      {error && (
        <ErrorNote>
          {error}
          {error.includes("Admins only") && " — add your email to ADMIN_EMAILS in functions/.env and redeploy."}
        </ErrorNote>
      )}
      {!data && !error && <Skeleton rows={2} />}
      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {LABELS.map(([k, label]) => (
              <Card key={k} className="!p-5">
                <div className="text-2xl font-bold tabular-nums text-[#5a2e14]">{data[k] ?? 0}</div>
                <div className="text-sm text-[#94725a]">{label}</div>
              </Card>
            ))}
          </div>
          <Card className="mt-6">
            <h2 className="font-semibold text-[#5a2e14] flex items-center gap-2"><Library size={18} /> Classic library</h2>
            <p className="mt-1 text-sm text-[#7d5b44]">
              Adds 20 famous public-domain shers (Ghalib, Mir, Dard, Zauq, Momin, Zafar, Daagh, Iqbal) with
              explanations and search vectors. Safe to run again — existing ones are skipped.
            </p>
            <button
              type="button"
              onClick={seed}
              disabled={seeding}
              className="mt-4 px-5 py-2.5 rounded-full bg-[#c26a3b] text-white font-medium hover:bg-[#a9552a] disabled:opacity-50"
            >
              {seeding ? "Loading…" : "Load classic library"}
            </button>
            {seedMsg && <p className="mt-3 text-sm text-[#5a3a28]" role="status">{seedMsg}</p>}
          </Card>
        </>
      )}
    </Page>
  );
}
