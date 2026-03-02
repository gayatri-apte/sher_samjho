import { useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useNavigate } from "react-router-dom";

export default function ThemeExplorer() {
  const [results, setResults] = useState<any[]>([]);
  const navigate = useNavigate();

  async function searchTheme(theme: string) {
    try {
      const q = query(
        collection(db, "global_poetry_cache"),
        where("themes", "array-contains", theme)
      );

      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => doc.data());
      setResults(data);
    } catch (e) {
      console.error("Theme search failed", e);
      setResults([]);
    }
  }

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
      <h1 className="text-3xl mb-6">Mood Explorer</h1>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => searchTheme("love")}
          className="px-4 py-2 rounded-lg bg-[#c26a3b] hover:bg-[#a9552a] text-white text-sm"
        >
          Love
        </button>
        <button
          onClick={() => searchTheme("longing")}
          className="px-4 py-2 rounded-lg bg-[#c26a3b] hover:bg-[#a9552a] text-white text-sm"
        >
          Longing
        </button>
        <button
          onClick={() => searchTheme("rebellion")}
          className="px-4 py-2 rounded-lg bg-[#c26a3b] hover:bg-[#a9552a] text-white text-sm"
        >
          Rebellion
        </button>
      </div>

      {results.map((item, i) => (
        <div key={i} className="mb-6 border-b border-[#e2c9ad] pb-4">
          <p className="text-xl whitespace-pre-wrap">
            {item.text ?? item.devanagariText}
          </p>
          {Array.isArray(item.themes) && item.themes.length > 0 && (
            <p className="mt-2 text-sm text-[#94725a]">
              Themes: {item.themes.join(", ")}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

