import {useEffect, useState} from "react";
import {collection, getDocs} from "firebase/firestore";
import {db} from "../../services/firebase";

export default function AdminDashboard() {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        setError("");
        const snap = await getDocs(collection(db, "global_poetry_cache"));
        setCount(snap.size);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load analytics");
        setCount(0);
      } finally {
        setLoading(false);
      }
    }

    void fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <h1 className="text-3xl mb-6">Admin Analytics</h1>
      <div className="space-y-4">
        <p>
          Total Shers:{" "}
          {loading ? (
            <span className="text-neutral-400">Loading…</span>
          ) : error ? (
            <span className="text-red-400">Error</span>
          ) : (
            <span className="text-white font-semibold">{count}</span>
          )}
        </p>
        {error && (
          <div className="bg-red-900 text-red-300 p-4 rounded mt-6">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

