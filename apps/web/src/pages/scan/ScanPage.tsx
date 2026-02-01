import {useState, useEffect} from "react";
import {onAuthStateChanged} from "firebase/auth";
import type {User} from "firebase/auth";
import {auth} from "../../services/firebase";
import CameraCapture from "../../components/camera/CameraCapture";
import ImageUpload from "../../components/camera/ImageUpload";
import {useOCR} from "../../features/ocr/useOCR";
import {useTashreeh} from "../../features/tashreeh/useTashreeh";
import {saveHistory} from "../../services/functions.service";


function textToHash(text: string): string {
  try {
    return btoa(unescape(encodeURIComponent(text))).slice(0, 32);
  } catch {
    return Array.from(text).reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0).toString(16).slice(0, 32);
  }
}

export default function ScanPage() {
  const [image, setImage] = useState<File | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const {text, loading, error, analyze} = useOCR();
  const {explanation, loading: explainLoading, error: explainError, explain} =
    useTashreeh();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (text) {
      setSaved(false);
      setSaveError(null);
    }
  }, [text]);

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] gap-6 px-4">
      <h2 className="text-3xl font-semibold">Scan Poetry</h2>

      {!image && (
        <>
          <CameraCapture onCapture={setImage} />
          <ImageUpload onSelect={setImage} />
        </>
      )}

      {image && (
        <>
          <img
            src={URL.createObjectURL(image)}
            alt="preview"
            className="max-w-md rounded-xl border border-neutral-700"
          />

          <button
            onClick={() => analyze(image)}
            disabled={loading}
            className="px-6 py-3 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>

          {error && (
            <div className="mt-4 max-w-xl p-4 bg-red-900/50 border border-red-700 rounded text-red-200">
              Error: {error}
            </div>
          )}

          {text && (
            <>
              {/* Poetry – natural language, no code styling */}
              <div
                className="mt-6 w-full max-w-4xl rounded-xl border border-neutral-700/50 bg-neutral-800/40 p-6 text-lg leading-relaxed text-neutral-100 text-right tracking-normal whitespace-pre-wrap break-words"
                style={{ fontFamily: "Noto Sans Devanagari, sans-serif" }}
              >
                {text}
              </div>
              <button
                onClick={async () => {
                  setSaveError(null);
                  setSaved(false);
                  setSaving(true);
                  const cacheHash = textToHash(text);

                  const savePromise =
                    user ?
                      saveHistory(cacheHash)
                        .then(() => setSaved(true))
                        .catch((err: unknown) => {
                          console.error("Save failed:", err);
                          setSaveError(
                            err instanceof Error ?
                              err.message :
                              "Could not save to history. Please try again."
                          );
                        })
                        .finally(() => setSaving(false)) :
                      Promise.resolve().finally(() => setSaving(false));

                  try {
                    await explain(text);
                  } catch {
                    // useTashreeh handles explain errors
                  }

                  await savePromise;
                }}
                disabled={explainLoading}
                className="px-6 py-3 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {explainLoading ? "Explaining..." : "Explain"}
              </button>
              {!user && text && (
                <p className="text-sm text-amber-500">
                  Log in to save to history
                </p>
              )}
              {saving && (
                <p className="text-sm text-neutral-400">Saving to history…</p>
              )}
              {saved && !saving && (
                <p className="text-sm text-green-400">Saved to history</p>
              )}
              {saveError && (
                <div className="mt-2 p-3 rounded bg-amber-900/40 border border-amber-700 text-amber-200 text-sm">
                  {saveError}
                </div>
              )}
              {explainError && (
                <div className="mt-4 max-w-xl p-4 bg-red-900/50 border border-red-700 rounded text-red-200">
                  Error: {explainError}
                </div>
              )}
            </>
          )}

          {/* Explanation – prose only, no syntax highlighting */}
          {explanation && (
            <div
              className="mt-6 w-full max-w-4xl rounded-xl border border-neutral-700/50 bg-neutral-800/40 p-6 text-lg leading-relaxed text-neutral-100 tracking-normal whitespace-pre-wrap break-words"
              style={{ fontFamily: "Noto Sans Devanagari, sans-serif" }}
            >
              {explanation}
            </div>
          )}

          <button
            onClick={() => setImage(null)}
            className="text-sm text-neutral-400 hover:text-neutral-200"
          >
            Retake
          </button>
        </>
      )}
    </div>
  );
}
