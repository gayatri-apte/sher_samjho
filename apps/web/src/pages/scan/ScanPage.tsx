import {useState, useEffect} from "react";
import {onAuthStateChanged} from "firebase/auth";
import type {User} from "firebase/auth";
import {auth} from "../../services/firebase";
import CameraCapture from "../../components/camera/CameraCapture";
import ImageUpload from "../../components/camera/ImageUpload";
import {useOCR} from "../../features/ocr/useOCR";
import type {TashreehLevels} from "../../features/ocr/ocr.service";
import {saveHistory, lookupDictionary, saveVocabulary} from "../../services/functions.service";
import PoetryText from "../../components/PoetryText";
import WordModal from "../../components/WordModal";

type ScriptView = "dev" | "roman" | "both";
type TashreehLevelKey = "beginner" | "intermediate" | "scholar";

export default function ScanPage() {
  const [image, setImage] = useState<File | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [script, setScript] = useState<ScriptView>("dev");
  const [tashreehLevel, setTashreehLevel] = useState<TashreehLevelKey>("beginner");
  const {
    result,
    devanagariText,
    romanText,
    tashreeh,
    textHash,
    loading,
    error,
    analyze,
  } = useOCR();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [popupWord, setPopupWord] = useState<string | null>(null);
  const [popupMeaning, setPopupMeaning] = useState<string>("");
  const [vocabularySaving, setVocabularySaving] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (result) {
      setSaved(false);
      setSaveError(null);
    }
  }, [result]);

  const hasText = Boolean(devanagariText || romanText);

  const tashreehLevels: TashreehLevels | null =
    result?.tashreeh == null
      ? null
      : typeof result.tashreeh === "object"
        ? result.tashreeh
        : {
            beginner: result.tashreeh,
            intermediate: result.tashreeh,
            scholar: result.tashreeh,
          };
  const tashreehText =
    tashreehLevels?.[tashreehLevel] ?? tashreehLevels?.beginner ?? "";

  async function handleWordClick(word: string) {
    const w = word.trim();
    if (!w) return;
    setPopupWord(w);
    setPopupMeaning("Loading…");
    try {
      const {meaning} = await lookupDictionary(w);
      setPopupMeaning(meaning);
    } catch (err) {
      console.error("Dictionary lookup failed:", err);
      setPopupMeaning(err instanceof Error ? err.message : "Lookup failed");
    }
  }

  function closeWordModal() {
    setPopupWord(null);
    setPopupMeaning("");
  }

  return (
    <div className="min-h-[calc(100vh-64px)] w-full overflow-x-hidden overflow-y-auto">
      <div className="flex flex-col items-center gap-6 px-4 py-6 w-full max-w-4xl mx-auto min-w-0">
        <h2 className="text-3xl font-semibold shrink-0">Scan Poetry</h2>
        <p className="text-sm text-neutral-400 -mt-2 shrink-0">
          Urdu or Hindi — we detect and explain both
        </p>

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
              className="w-full max-w-md max-h-[40vh] object-contain rounded-xl border border-neutral-700 shrink-0"
            />

          <button
            onClick={() => analyze(image)}
            disabled={loading}
            className="px-6 py-3 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>

          {error && (
            <div className="mt-4 w-full max-w-xl p-4 bg-red-900/50 border border-red-700 rounded text-red-200 shrink-0">
              Error: {error}
            </div>
          )}

          {hasText && (
            <>
              <div className="mt-4 flex flex-wrap items-center gap-3 w-full max-w-4xl shrink-0">
                {result?.script && (
                  <span className="text-xs px-2 py-1 rounded bg-neutral-700 text-neutral-300">
                    {result.script === "devanagari" ? "Hindi" : "Urdu"} poetry
                  </span>
                )}
                <span className="text-sm text-neutral-400">Display:</span>
                <select
                  value={script}
                  onChange={(e) => setScript(e.target.value as ScriptView)}
                  className="rounded border border-neutral-600 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-200"
                >
                  <option value="dev">Devanagari</option>
                  <option value="roman">Roman</option>
                  <option value="both">Both</option>
                </select>
              </div>

              {script !== "roman" && devanagariText && (
                <div
                  className="mt-6 w-full min-w-0 max-w-4xl rounded-xl border border-neutral-700/50 bg-neutral-800/40 p-6 text-neutral-100 text-right tracking-normal whitespace-pre-wrap break-words overflow-hidden"
                  style={{ fontFamily: "Noto Sans Devanagari, sans-serif" }}
                >
                  <PoetryText text={devanagariText} onWordClick={handleWordClick} />
                </div>
              )}
              {script !== "dev" && romanText && (
                <div className="mt-6 w-full min-w-0 max-w-4xl rounded-xl border border-neutral-700/50 bg-neutral-800/40 p-6 text-neutral-100 text-right tracking-normal whitespace-pre-wrap break-words overflow-hidden">
                  <PoetryText text={romanText} onWordClick={handleWordClick} />
                </div>
              )}

              <button
                onClick={async () => {
                  if (!user) return;
                  setSaveError(null);
                  setSaved(false);
                  setSaving(true);
                  try {
                    await saveHistory({
                      cacheHash: textHash ?? "",
                      text: devanagariText ?? result?.rawUrdu ?? "",
                      explanation: tashreehText || (typeof tashreeh === "string" ? tashreeh : ""),
                      devanagariText: devanagariText ?? undefined,
                      tashreeh: tashreehText || (typeof tashreeh === "string" ? tashreeh : undefined),
                    });
                    setSaved(true);
                  } catch (err: unknown) {
                    console.error("Save failed:", err);
                    setSaveError(
                      err instanceof Error ?
                        err.message :
                        "Could not save to history. Please try again."
                    );
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="px-6 py-3 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save to history"}
              </button>
              {tashreehLevels && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-neutral-400">Explanation:</span>
                  <select
                    value={tashreehLevel}
                    onChange={(e) =>
                      setTashreehLevel(e.target.value as TashreehLevelKey)
                    }
                    className="rounded border border-neutral-600 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-200"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="scholar">Scholar</option>
                  </select>
                </div>
              )}
              {!user && hasText && (
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
            </>
          )}

          {tashreehText && (
            <div
              className="mt-6 w-full min-w-0 max-w-4xl rounded-xl border border-neutral-700/50 bg-neutral-800/40 p-6 text-lg leading-relaxed text-neutral-100 tracking-normal whitespace-pre-wrap break-words overflow-hidden"
              style={{ fontFamily: "Noto Sans Devanagari, sans-serif" }}
            >
              {tashreehText}
            </div>
          )}

          <button
            onClick={() => setImage(null)}
            className="text-sm text-neutral-400 hover:text-neutral-200 shrink-0"
          >
            Retake
          </button>

          {popupWord != null && (
            <WordModal
              word={popupWord}
              meaning={popupMeaning}
              saving={vocabularySaving}
              meaningLoading={popupMeaning === "Loading…"}
              onSave={async () => {
                if (!popupWord) return;
                setVocabularySaving(true);
                try {
                  await saveVocabulary(popupWord, popupMeaning);
                  closeWordModal();
                } catch (err) {
                  console.error("Save to vocabulary failed:", err);
                } finally {
                  setVocabularySaving(false);
                }
              }}
              onClose={closeWordModal}
            />
          )}
        </>
        )}
      </div>
    </div>
  );
}
