import {useEffect, useState} from "react";
import {onAuthStateChanged} from "firebase/auth";
import {auth} from "../../services/firebase";
import {callHistory} from "../../services/functions.service";

export default function HistoryPage() {
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setIsLoggedIn(!!user);
      if (!user) {
        setLoading(false);
        setScans([]);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await callHistory();
        setScans(data || []);
      } catch (e: unknown) {
        console.error("Failed to fetch history:", e);
        setError(
          e instanceof Error ? e.message : "Failed to load history"
        );
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const formatDate = (createdAt: any) => {
    if (!createdAt) return "Unknown date";
    
    // Handle Firestore timestamp format {seconds, nanoseconds} or {_seconds, _nanoseconds}
    if (createdAt.seconds !== undefined) {
      return new Date(createdAt.seconds * 1000).toLocaleString();
    }
    if (createdAt._seconds !== undefined) {
      return new Date(createdAt._seconds * 1000).toLocaleString();
    }
    // Handle ISO string format
    if (typeof createdAt === "string") {
      return new Date(createdAt).toLocaleString();
    }
    // Handle Date object
    if (createdAt instanceof Date) {
      return createdAt.toLocaleString();
    }
    return "Invalid date";
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Scan History</h1>

      {loading && (
        <div className="text-neutral-400">Loading...</div>
      )}

      {error && (
        <div className="p-4 bg-red-900/50 border border-red-700 rounded text-red-200">
          Error: {error}
        </div>
      )}

      {!loading && !error && scans.length === 0 && (
        <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/50 text-neutral-400">
          {isLoggedIn === false ? (
            <>
              <p className="font-medium text-neutral-300 mb-2">
                Log in to view history
              </p>
              <p className="text-sm">
                Sign in to see your saved poetry scans.
              </p>
            </>
          ) : (
            <>
              <p className="font-medium text-neutral-300 mb-2">
                No scan history yet
              </p>
              <p className="text-sm">
                Scan a poetry image, then click &quot;Explain&quot; to save it
                to your history.
              </p>
            </>
          )}
        </div>
      )}

      {!loading && !error && scans.map((s: any) => (
        <div
          key={s.id}
          className="p-4 rounded bg-neutral-900 border border-neutral-800"
        >
          <div className="text-sm text-neutral-400">
            {formatDate(s.createdAt)}
          </div>
          <div className="font-mono text-xs mt-2">
            {s.cacheHash}
          </div>
          {s.source && (
            <div className="text-xs text-neutral-500 mt-1">
              Source: {s.source}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
