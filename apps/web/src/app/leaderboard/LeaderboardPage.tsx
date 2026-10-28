import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {api} from "../../config/api";

type LeaderboardUser = {
  id: string;
  displayName?: string;
  currentStreak?: number;
  longestStreak?: number;
  totalReviews?: number;
  totalScans?: number;
  bestRecitationScore?: number;
};

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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
      <div className="min-h-screen bg-[#f8eee3] text-[#3b2419] p-8 flex items-center justify-center">
        <div>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mb-4 inline-flex items-center gap-2 text-sm text-[#c26a3b] hover:text-[#a9552a]"
          >
            <span className="text-lg">←</span>
            <span>Back to Home</span>
          </button>
          <p className="text-[#94725a]">Loading leaderboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8eee3] text-[#3b2419] p-8 flex items-center justify-center">
        <div>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mb-4 inline-flex items-center gap-2 text-sm text-[#c26a3b] hover:text-[#a9552a]"
          >
            <span className="text-lg">←</span>
            <span>Back to Home</span>
          </button>
          <p className="text-amber-700" role="alert">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8eee3] text-[#3b2419] p-8">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="mb-4 inline-flex items-center gap-2 text-sm text-[#c26a3b] hover:text-[#a9552a]"
      >
        <span className="text-lg">←</span>
        <span>Back to Home</span>
      </button>
      <h1 className="text-3xl mb-6">Top Learners</h1>

      {users.length === 0 && (
        <p className="text-[#94725a]">No learners yet. Start your streak!</p>
      )}

      <div className="space-y-3">
        {users.map((u, i) => (
          <div
            key={u.id}
            className="flex justify-between items-center p-3 bg-[#fff7ef] border border-[#e2c9ad] rounded-xl"
          >
            <span className="text-[#94725a]">#{i + 1}</span>
            <span className="flex-1 mx-4 truncate">
              {u.displayName || "Learner"}
            </span>
            <span className="text-sm text-[#5a3a28]">
              {(u.currentStreak ?? u.longestStreak ?? 0)} day streak
            </span>
            <span className="text-sm text-[#b08a6a] ml-4">
              {u.totalReviews ?? 0} reviews
            </span>
            <span className="text-sm text-[#b08a6a] ml-4 hidden sm:inline">
              best recital {u.bestRecitationScore ?? 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

