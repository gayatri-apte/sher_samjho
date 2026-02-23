import {useEffect, useState} from "react";
import {doc, getDoc} from "firebase/firestore";
import {getAuth} from "firebase/auth";
import {db} from "../../services/firebase";

type UserStats = {
  currentStreak?: number;
  longestStreak?: number;
  totalReviews?: number;
  totalScans?: number;
  masteryScore?: number;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<UserStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const auth = getAuth();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          setLoading(false);
          return;
        }
        const snap = await getDoc(doc(db, "users", uid));
        if (!cancelled) {
          setStats((snap.data() as UserStats) || {});
        }
      } catch {
        if (!cancelled) {
          setError("Could not load your study stats.");
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
  }, [auth]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
        <p className="text-neutral-400">Loading your study insights…</p>
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
      <h1 className="text-3xl mb-6">Your Study Insights</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-neutral-900 p-6 rounded">
          <p className="text-sm text-neutral-400 mb-1">Current Streak</p>
          <h2 className="text-2xl">{stats.currentStreak || 0}</h2>
        </div>

        <div className="bg-neutral-900 p-6 rounded">
          <p className="text-sm text-neutral-400 mb-1">Longest Streak</p>
          <h2 className="text-2xl">{stats.longestStreak || 0}</h2>
        </div>

        <div className="bg-neutral-900 p-6 rounded">
          <p className="text-sm text-neutral-400 mb-1">Total Reviews</p>
          <h2 className="text-2xl">{stats.totalReviews || 0}</h2>
        </div>

        <div className="bg-neutral-900 p-6 rounded">
          <p className="text-sm text-neutral-400 mb-1">Total Scans</p>
          <h2 className="text-2xl">{stats.totalScans || 0}</h2>
        </div>

        <div className="bg-neutral-900 p-6 rounded">
          <p className="text-sm text-neutral-400 mb-1">Mastery Score</p>
          <h2 className="text-2xl">{stats.masteryScore || 0}</h2>
        </div>
      </div>
    </div>
  );
}

