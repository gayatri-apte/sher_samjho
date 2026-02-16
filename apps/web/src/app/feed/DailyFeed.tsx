import {useEffect, useState} from "react";
import {collection, getDocs} from "firebase/firestore";
import {db} from "../../services/firebase";

type Sher = {
  devanagariText?: string;
  text?: string;
  poet?: string;
};

export default function DailyFeed() {
  const [daily, setDaily] = useState<Sher | null>(null);

  useEffect(() => {
    async function fetchRandom() {
      try {
        const snap = await getDocs(collection(db, "global_poetry_cache"));
        const all = snap.docs.map((doc) => doc.data() as Sher);
        if (all.length === 0) {
          setDaily(null);
          return;
        }
        const random = all[Math.floor(Math.random() * all.length)];
        setDaily(random);
      } catch (err) {
        console.error("Failed to load daily poetry", err);
      }
    }

    void fetchRandom();
  }, []);

  if (!daily) {
    return (
      <div className="min-h-screen bg-black text-white p-10">
        <h1 className="text-3xl mb-4">Daily Poetry</h1>
        <p className="text-neutral-400">No poetry available yet.</p>
      </div>
    );
  }

  const text = daily.devanagariText ?? daily.text ?? "";

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <h1 className="text-3xl mb-6">Daily Poetry</h1>
      <p className="text-2xl whitespace-pre-wrap">{text}</p>
      {daily.poet && (
        <p className="mt-4 text-neutral-400">— {daily.poet}</p>
      )}
    </div>
  );
}

