import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useParams, useNavigate } from "react-router-dom";

export default function PoetDetails() {
  const { name } = useParams();
  const [poems, setPoems] = useState<any[]>([]);
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-[#f8eee3] text-[#3b2419] p-10">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="mb-4 inline-flex items-center gap-2 text-sm text-[#c26a3b] hover:text-[#a9552a]"
      >
        <span className="text-lg">←</span>
        <span>Back to Home</span>
      </button>
      <h1 className="text-3xl mb-6">{name}</h1>

      {poems.map((poem, i) => (
        <div key={i} className="mb-6 border-b border-[#e2c9ad] pb-4">
          <p className="text-2xl leading-loose">{poem.text}</p>
        </div>
      ))}
    </div>
  );
}

