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
    <div className="min-h-screen bg-black text-white p-10">
      <h1 className="text-4xl mb-8">Poet Explorer</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {poets.map((poet) => (
          <div
            key={poet.id}
            onClick={() => navigate(`/explorer/poets/${poet.name}`)}
            className="bg-neutral-800 p-6 rounded cursor-pointer hover:bg-neutral-700"
          >
            <h2 className="text-xl font-semibold">{poet.name}</h2>
            <p className="text-neutral-400">{poet.era}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

