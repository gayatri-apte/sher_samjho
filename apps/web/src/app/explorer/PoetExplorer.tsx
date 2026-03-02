import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useNavigate } from "react-router-dom";

type Poet = {
  id: string;
  name: string;
  era: string;
  movement?: string;
};

export default function PoetExplorer() {
  const [poets, setPoets] = useState<Poet[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPoets() {
      const snap = await getDocs(collection(db, "poets"));
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Poet[];
      setPoets(data);
    }

    fetchPoets();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8eee3] text-[#3b2419] p-10">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="mb-4 inline-flex items-center gap-2 text-sm text-[#c26a3b] hover:text-[#a9552a]"
      >
        <span className="text-lg">←</span>
        <span>Back to Home</span>
      </button>
      <h1 className="text-4xl mb-8">Poet Explorer</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {poets.map((poet) => (
          <div
            key={poet.id}
            onClick={() => navigate(`/explorer/poets/${poet.name}`)}
            className="bg-[#fff7ef] border border-[#e2c9ad] p-6 rounded-xl cursor-pointer hover:bg-[#f6e2cf] transition-colors"
          >
            <h2 className="text-xl font-semibold">{poet.name}</h2>
            <p className="text-[#94725a]">{poet.era}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

