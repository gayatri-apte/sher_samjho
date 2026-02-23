import {useEffect, useState} from "react";
import {Link, useLocation} from "react-router-dom";
import {collection, getDocs, query, where} from "firebase/firestore";
import {db} from "../../services/firebase";
import Comments from "../../components/Comments";
import FollowPoet from "../../components/FollowPoet";
import ShareCard from "../../components/ShareCard";
import AudioPlayer from "../../components/AudioPlayer";
import Recorder from "../../components/Recorder";
import OfficialRecitations from "../../components/OfficialRecitations.tsx";
import {useAuth} from "../../hooks/useAuth";

export default function ReaderPage() {
  const {state} = useLocation();
  const text = state?.text;
  const explanation = state?.explanation ?? state?.tashreeh ?? "";
  const ocrConfidence = typeof state?.ocrConfidence === "number" ? state.ocrConfidence : null;
  const attributionConfidence =
    typeof state?.attributionConfidence === "number" ?
      state.attributionConfidence :
      null;
  const {isAuthenticated} = useAuth();
  const [poet, setPoet] = useState(state?.poet ?? "");
  const [similar, setSimilar] = useState<any[]>([]);
  const sherId: string | undefined =
    state?.cacheHash && typeof state.cacheHash === "string"
      ? state.cacheHash
      : undefined;

  useEffect(() => {
    async function fetchSimilar() {
      if (!poet) return;

      const q = query(
        collection(db, "global_poetry_cache"),
        where("poet", "==", poet)
      );

      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => doc.data());
      setSimilar(data.slice(0, 3));
    }

    fetchSimilar();
  }, [poet]);

  if (!text) {
    return (
      <div className="min-h-screen bg-black text-neutral-400 flex flex-col items-center justify-center gap-4 px-6">
        <p>No text to read yet.</p>
        <p className="text-neutral-500 text-sm text-center max-w-sm">
          Open a sher from <Link to="/search" className="text-blue-400 hover:underline">Search</Link> or{" "}
          <Link to="/history" className="text-blue-400 hover:underline">History</Link> to read it here.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-neutral-100 px-12 py-20">
      <div className="mb-6 flex items-center gap-4">
        <label className="text-sm text-neutral-400">
          Poet
        </label>
        <select
          value={poet}
          onChange={(e) => setPoet(e.target.value)}
          className="bg-neutral-800 text-neutral-100 text-sm px-3 py-2 rounded border border-neutral-700"
        >
          <option value="">Unknown Poet</option>
          <option value="Mirza Ghalib">Mirza Ghalib</option>
          <option value="Mir Taqi Mir">Mir Taqi Mir</option>
          <option value="Faiz Ahmed Faiz">Faiz Ahmed Faiz</option>
        </select>
        {poet && <FollowPoet poetId={poet} />}
      </div>

      <div className="text-2xl leading-loose tracking-wide font-serif whitespace-pre-wrap">
        {text.split("\n").map((line: string, lineIdx: number) => (
          <p key={lineIdx}>
            {line.split(/\s+/).filter(Boolean).map((w: string, i: number) => (
              <span key={i} className="mx-1 hover:bg-yellow-500">
                {w}
              </span>
            ))}
          </p>
        ))}
      </div>

      <AudioPlayer text={text} />

      {sherId && isAuthenticated && <Recorder sherId={sherId} />}

      {sherId && <OfficialRecitations sherId={sherId} />}

      <ShareCard text={text} poet={poet} />

      {sherId && (
        <p className="mt-4">
          <Link
            to="/poetry-ai"
            state={{ cacheHash: sherId }}
            className="text-indigo-400 hover:underline"
          >
            Ask the AI about this sher →
          </Link>
        </p>
      )}

      {ocrConfidence != null && (
        <p className="text-sm text-neutral-400 mt-4">
          OCR Confidence: {(ocrConfidence * 100).toFixed(1)}%
        </p>
      )}

      {attributionConfidence != null && (
        <p className="text-sm text-neutral-400">
          Attribution Confidence:{" "}
          {attributionConfidence === 1 ? "Confirmed" : "Unverified"}
        </p>
      )}

      {explanation && (
        <div className="mt-10 text-lg leading-relaxed text-neutral-200 whitespace-pre-wrap">
          {explanation}
        </div>
      )}

      {similar.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl mt-12 mb-4">Similar Shers</h2>
          {similar.map((item, i) => (
            <div key={i} className="mb-4 text-neutral-300">
              {item.text}
            </div>
          ))}
        </div>
      )}

      <Comments sherId={sherId} />
    </div>
  );
}
