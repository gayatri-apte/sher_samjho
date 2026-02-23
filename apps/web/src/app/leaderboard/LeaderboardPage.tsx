import {useEffect, useState} from "react";
import {api} from "../../config/api";

type LeaderboardUser = {
  id: string;
  displayName?: string;
  currentStreak?: number;
  longestStreak?: number;
  totalReviews?: number;
  totalScans?: number;
  masteryScore?: number;
};

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(api.leaderboard);
        const data = await res.json().catch(() => []);
        if (!res.ok) {
          if (!cancelled) {
            setError(
              (data && (data as {error?: string}).error) ||
                "Failed to load leaderboard"
            );
          }
          return;
        }
        if (!cancelled) {
          setUsers(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load leaderboard");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
        <p className="text-neutral-400">Loading leaderboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
        <p className="text-amber-400" role="alert">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl mb-6">Top Learners</h1>

      {users.length === 0 && (
        <p className="text-neutral-400">No learners yet. Start your streak!</p>
      )}

      <div className="space-y-3">
        {users.map((u, i) => (
          <div
            key={u.id}
            className="flex justify-between items-center p-3 bg-neutral-900 rounded"
          >
            <span className="text-neutral-400">#{i + 1}</span>
            <span className="flex-1 mx-4 truncate">
              {u.displayName || u.id}
            </span>
            <span className="text-sm text-neutral-300">
              {(u.currentStreak ?? u.longestStreak ?? 0)} day streak
            </span>
            <span className="text-sm text-neutral-500 ml-4">
              {u.totalReviews ?? 0} reviews
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

