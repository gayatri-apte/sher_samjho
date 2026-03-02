import {useCallback, useEffect, useState} from "react";
import {collection, getDocs} from "firebase/firestore";
import {useNavigate} from "react-router-dom";
import {db} from "../../services/firebase";

type SherDoc = {
  id: string;
  devanagariText?: string;
  text?: string;
  poet?: string;
  tashreeh?: string;
  explanation?: string;
  ocrConfidence?: number;
  attributionConfidence?: number;
  [key: string]: unknown;
};

export default function DailyFeed() {
  const [daily, setDaily] = useState<SherDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [allDocs, setAllDocs] = useState<SherDoc[]>([]);
  const navigate = useNavigate();

  const fetchRandom = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "global_poetry_cache"));
      const list = snap.docs.map((d) => {
        const data = d.data();
        return {...data, id: d.id} as SherDoc;
      });
      setAllDocs(list);
      if (list.length === 0) {
        setDaily(null);
      } else {
        const random = list[Math.floor(Math.random() * list.length)];
        setDaily(random);
      }
    } catch (err) {
      console.error("Failed to load daily poetry", err);
      setDaily(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRandom();
  }, [fetchRandom]);

  function pickAnother() {
    if (allDocs.length === 0) return;
    const random = allDocs[Math.floor(Math.random() * allDocs.length)];
    setDaily(random);
  }

  function openInReader() {
    if (!daily) return;
    const text = daily.devanagariText ?? daily.text ?? "";
    navigate("/reader", {
      state: {
        text,
        poet: daily.poet ?? "",
        explanation: daily.tashreeh ?? daily.explanation ?? "",
        ocrConfidence: daily.ocrConfidence,
        attributionConfidence: daily.attributionConfidence,
        cacheHash: daily.id,
      },
    });
  }

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
        <h1 className="text-3xl mb-4">Daily Poetry</h1>
        <p className="text-[#94725a]">Loading…</p>
      </div>
    );
  }

  if (!daily) {
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
        <h1 className="text-3xl mb-4">Daily Poetry</h1>
        <p className="text-[#94725a] mb-4">No poetry available yet.</p>
        <p className="text-sm text-[#94725a]">
          Use <strong>Scan</strong> to add poetry to the app; then a random sher will appear here each time you open Daily Feed, and you can read and comment on it.
        </p>
      </div>
    );
  }

  const text = daily.devanagariText ?? daily.text ?? "";

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
      <h1 className="text-3xl mb-2">Daily Poetry</h1>
      <p className="text-sm text-[#94725a] mb-6">
        A random sher from the collection. Open it in Reader to see meaning, like, and comment.
      </p>

      <div
        className="p-6 rounded-xl border border-[#e2c9ad] bg-[#fff7ef] cursor-pointer hover:bg-[#f6e2cf] transition-colors"
        onClick={openInReader}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && openInReader()}
      >
        <p className="text-2xl whitespace-pre-wrap">{text}</p>
        {daily.poet && (
          <p className="mt-4 text-[#94725a]">— {daily.poet}</p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={openInReader}
          className="px-4 py-2 rounded-lg bg-[#c26a3b] hover:bg-[#a9552a] text-white text-sm font-medium"
        >
          Open in Reader
        </button>
        <button
          type="button"
          onClick={pickAnother}
          className="px-4 py-2 rounded-lg border border-[#e2c9ad] bg-[#fff7ef] text-[#3b2419] hover:bg-[#f6e2cf] text-sm font-medium"
        >
          Another sher
        </button>
      </div>
    </div>
  );
}

