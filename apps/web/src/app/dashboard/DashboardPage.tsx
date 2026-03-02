import {useEffect, useState} from "react";
import {doc, getDoc} from "firebase/firestore";
import {getAuth} from "firebase/auth";
import {useNavigate} from "react-router-dom";
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
  const navigate = useNavigate();

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
          <p className="text-[#94725a]">Loading your study insights…</p>
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
      <h1 className="text-3xl mb-6">Your Study Insights</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-[#fff7ef] border border-[#e2c9ad] p-6 rounded-xl shadow-sm">
          <p className="text-sm text-[#94725a] mb-1">Current Streak</p>
          <h2 className="text-2xl">{stats.currentStreak || 0}</h2>
        </div>

        <div className="bg-[#fff7ef] border border-[#e2c9ad] p-6 rounded-xl shadow-sm">
          <p className="text-sm text-[#94725a] mb-1">Longest Streak</p>
          <h2 className="text-2xl">{stats.longestStreak || 0}</h2>
        </div>

        <div className="bg-[#fff7ef] border border-[#e2c9ad] p-6 rounded-xl shadow-sm">
          <p className="text-sm text-[#94725a] mb-1">Total Reviews</p>
          <h2 className="text-2xl">{stats.totalReviews || 0}</h2>
        </div>

        <div className="bg-[#fff7ef] border border-[#e2c9ad] p-6 rounded-xl shadow-sm">
          <p className="text-sm text-[#94725a] mb-1">Total Scans</p>
          <h2 className="text-2xl">{stats.totalScans || 0}</h2>
        </div>

        <div className="bg-[#fff7ef] border border-[#e2c9ad] p-6 rounded-xl shadow-sm">
          <p className="text-sm text-[#94725a] mb-1">Mastery Score</p>
          <h2 className="text-2xl">{stats.masteryScore || 0}</h2>
        </div>
      </div>
    </div>
  );
}

