import { useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../services/firebase";

export default function ThemeExplorer() {
  const [results, setResults] = useState<any[]>([]);

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
    <div className="min-h-screen bg-black text-white p-10">
      <h1 className="text-3xl mb-6">Mood Explorer</h1>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => searchTheme("love")}
          className="px-4 py-2 rounded bg-neutral-800 hover:bg-neutral-700"
        >
          Love
        </button>
        <button
          onClick={() => searchTheme("longing")}
          className="px-4 py-2 rounded bg-neutral-800 hover:bg-neutral-700"
        >
          Longing
        </button>
        <button
          onClick={() => searchTheme("rebellion")}
          className="px-4 py-2 rounded bg-neutral-800 hover:bg-neutral-700"
        >
          Rebellion
        </button>
      </div>

      {results.map((item, i) => (
        <div key={i} className="mb-6 border-b border-neutral-700 pb-4">
          <p className="text-xl whitespace-pre-wrap">
            {item.text ?? item.devanagariText}
          </p>
          {Array.isArray(item.themes) && item.themes.length > 0 && (
            <p className="mt-2 text-sm text-neutral-400">
              Themes: {item.themes.join(", ")}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

