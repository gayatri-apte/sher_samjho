import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { Flame, ScanLine, Mic2, Trophy, BookMarked, Repeat } from "lucide-react";
import Page, { Card, ErrorNote } from "../../components/ui/Page";
import { Skeleton } from "../../components/SherCard";
import { auth, db } from "../../services/firebase";

type Stats = {
  currentStreak?: number;
  longestStreak?: number;
  totalReviews?: number;
  totalScans?: number;
  totalRecitations?: number;
  bestRecitationScore?: number;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    auth.authStateReady().then(async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return setStats({});
      try {
        const snap = await getDoc(doc(db, "users", uid));
        setStats((snap.data() as Stats) || {});
      } catch {
        setError("Could not load your progress.");
      }
    });
  }, []);

  const tiles = [
    { icon: <Flame />, label: "Current streak", value: `${stats?.currentStreak ?? 0} days` },
    { icon: <Trophy />, label: "Longest streak", value: `${stats?.longestStreak ?? 0} days` },
    { icon: <Mic2 />, label: "Recitations with Ustad", value: stats?.totalRecitations ?? 0 },
    { icon: <Trophy />, label: "Best recitation", value: `${stats?.bestRecitationScore ?? 0}/100` },
    { icon: <ScanLine />, label: "Shers scanned", value: stats?.totalScans ?? 0 },
    { icon: <Repeat />, label: "Word reviews", value: stats?.totalReviews ?? 0 },
  ];

  return (
    <Page title="My progress" subtitle="Your practice at a glance.">
      {error && <ErrorNote>{error}</ErrorNote>}
      {!stats && !error ? (
        <Skeleton rows={2} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {tiles.map((t) => (
            <Card key={t.label} className="!p-5">
              <div className="text-[#c26a3b]">{t.icon}</div>
              <div className="mt-3 text-2xl font-bold tabular-nums text-[#5a2e14]">{t.value}</div>
              <div className="text-sm text-[#94725a]">{t.label}</div>
            </Card>
          ))}
        </div>
      )}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/ustad" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#c26a3b] text-white font-medium hover:bg-[#a9552a]">
          <Mic2 size={16} /> Practise today's sher
        </Link>
        <Link to="/vocabulary" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#e2c9ad] text-[#5a321c] hover:bg-[#f6e2cf]">
          <BookMarked size={16} /> Review my deck
        </Link>
      </div>
    </Page>
  );
}
