import {useEffect, useState} from "react";
import {getAuth} from "firebase/auth";
import {useNavigate} from "react-router-dom";
import {api} from "../../config/api";

type AnalyticsData = {
  totalUsers?: number;
  totalScans?: number;
  totalReviews?: number;
  totalAIQueries?: number;
  aiFailures?: number;
  totalRecitations?: number;
};

export default function AdminDashboard() {
  const [data, setData] = useState<AnalyticsData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);

        const user = auth.currentUser;
        if (!user) {
          setError("You must be logged in to view admin analytics.");
          setLoading(false);
          return;
        }

        const token = await user.getIdToken();
        const res = await fetch(api.adminAnalytics, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          if (!cancelled) {
            setError(json?.error || "Failed to load analytics");
          }
          return;
        }

        if (!cancelled) {
          setData(json as AnalyticsData);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError("Failed to load analytics");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchStats();
    return () => {
      cancelled = true;
    };
  }, [auth]);

  if (loading) {
    return (
      <div
        className="min-h-screen text-[#3b2419] p-10 bg-cover bg-no-repeat bg-center"
        style={{backgroundImage: "url('/images/background-pattern-soft.png')"}}
      >
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-4 inline-flex items-center gap-2 text-sm text-[#c26a3b] hover:text-[#a9552a]"
        >
          <span className="text-lg">←</span>
          <span>Back to Home</span>
        </button>
        <h1 className="text-3xl mb-8">Admin Analytics</h1>
        <p className="text-[#94725a]">Loading analytics…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen text-[#3b2419] p-10 bg-cover bg-no-repeat bg-center"
        style={{backgroundImage: "url('/images/background-pattern-soft.png')"}}
      >
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-4 inline-flex items-center gap-2 text-sm text-[#c26a3b] hover:text-[#a9552a]"
        >
          <span className="text-lg">←</span>
          <span>Back to Home</span>
        </button>
        <h1 className="text-3xl mb-8">Admin Analytics</h1>
        <p className="text-amber-700" role="alert">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen text-[#3b2419] p-10 bg-cover bg-no-repeat bg-center"
      style={{backgroundImage: "url('/images/background-pattern-soft.png')"}}
    >
      <button
        type="button"
        onClick={() => navigate("/")}
        className="mb-4 inline-flex items-center gap-2 text-sm text-[#c26a3b] hover:text-[#a9552a]"
      >
        <span className="text-lg">←</span>
        <span>Back to Home</span>
      </button>
      <h1 className="text-3xl mb-8">Admin Analytics</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card title="Total Users" value={data.totalUsers} />
        <Card title="Total Scans" value={data.totalScans} />
        <Card title="Total Reviews" value={data.totalReviews} />
        <Card title="AI Queries" value={data.totalAIQueries} />
        <Card title="AI Failures" value={data.aiFailures} />
        <Card title="Recitations" value={data.totalRecitations} />
      </div>
    </div>
  );
}

type CardProps = {
  title: string;
  value?: number;
};

function Card({title, value}: CardProps) {
  return (
    <div className="bg-[#fff7ef] border border-[#e2c9ad] p-6 rounded-xl shadow-sm">
      <p className="text-[#94725a]">{title}</p>
      <h2 className="text-2xl mt-2">{value ?? 0}</h2>
    </div>
  );
}

