import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useParams } from "react-router-dom";

export default function PoetDetails() {
  const { name } = useParams();
  const [poems, setPoems] = useState<any[]>([]);

  useEffect(() => {
    async function fetchPoems() {
      if (!name) return;

      const q = query(
        collection(db, "global_poetry_cache"),
        where("poet", "==", name)
      );

      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => doc.data());
      setPoems(data);
    }

    fetchPoems();
  }, [name]);

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <h1 className="text-3xl mb-6">{name}</h1>

      {poems.map((poem, i) => (
        <div key={i} className="mb-6 border-b border-neutral-700 pb-4">
          <p className="text-2xl leading-loose">{poem.text}</p>
        </div>
      ))}
    </div>
  );
}

