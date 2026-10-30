import { useEffect, useState } from "react";
import { Flame, Trophy } from "lucide-react";
import Page, { ErrorNote } from "../../components/ui/Page";
import { EmptyState, Skeleton } from "../../components/SherCard";
import { api } from "../../config/api";
import { apiJSON } from "../../lib/http";
import { useAuth } from "../../hooks/useAuth";

type Learner = {
  id: string;
  displayName: string;
  currentStreak: number;
  longestStreak: number;
  totalReviews: number;
  totalScans: number;
  totalRecitations: number;
  bestRecitationScore: number;
};

const MEDAL = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Learner[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiJSON<Learner[]>(api.leaderboard)
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load leaderboard"));
  }, []);

  return (
    <Page title="Leaderboard" subtitle="Ranked by longest daily streak. Practise a little every day.">
      {error && <ErrorNote>{error}</ErrorNote>}
      {!rows && !error && <Skeleton />}
      {rows && rows.length === 0 && <EmptyState title="No learners yet — be the first!" />}
      {rows && rows.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-[#ecd6bd] bg-[#fff8f0]">
          <table className="w-full text-sm">
            <thead className="bg-[#f6e2cf] text-[#5a321c]">
              <tr>
                <th className="px-4 py-3 text-left w-12">#</th>
                <th className="px-4 py-3 text-left">Learner</th>
                <th className="px-4 py-3 text-right"><Flame size={14} className="inline -mt-0.5" /> Best streak</th>
                <th className="px-4 py-3 text-right hidden sm:table-cell">Recitations</th>
                <th className="px-4 py-3 text-right hidden sm:table-cell"><Trophy size={14} className="inline -mt-0.5" /> Best score</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={`border-t border-[#f0dfcc] ${r.id === user?.uid ? "bg-[#fdeee0] font-medium" : ""}`}>
                  <td className="px-4 py-3">{MEDAL[i] ?? i + 1}</td>
                  <td className="px-4 py-3 text-[#3b2419]">{r.displayName}{r.id === user?.uid ? " (you)" : ""}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.longestStreak} days</td>
                  <td className="px-4 py-3 text-right tabular-nums hidden sm:table-cell">{r.totalRecitations}</td>
                  <td className="px-4 py-3 text-right tabular-nums hidden sm:table-cell">{r.bestRecitationScore || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Page>
  );
}
