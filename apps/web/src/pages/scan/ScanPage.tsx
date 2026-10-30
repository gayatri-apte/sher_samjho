import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic2, Sparkles, Save, RotateCcw, ScanLine } from "lucide-react";
import CameraCapture from "../../components/camera/CameraCapture";
import ImageUpload from "../../components/camera/ImageUpload";
import { useOCR } from "../../features/ocr/useOCR";
import type { TashreehLevels } from "../../features/ocr/ocr.service";
import { saveHistory, lookupDictionary, saveVocabulary } from "../../services/functions.service";
import PoetryText from "../../components/PoetryText";
import WordModal from "../../components/WordModal";
import SpeakButton from "../../components/voice/SpeakButton";
import Page, { Card, ErrorNote } from "../../components/ui/Page";
import { useAuth } from "../../hooks/useAuth";

type ScriptView = "dev" | "urdu" | "roman" | "all";
type Level = "beginner" | "intermediate" | "scholar";

const POETS = [
  "Mirza Ghalib", "Mir Taqi Mir", "Allama Iqbal", "Momin Khan Momin", "Daagh Dehlvi",
  "Sheikh Ibrahim Zauq", "Khwaja Mir Dard", "Bahadur Shah Zafar", "Faiz Ahmed Faiz", "Jaun Elia", "Ahmad Faraz",
];

// Printed-page samples in public/samples, so anyone can try Scan without a book.
const SAMPLES: Array<{ file: string; label: string; poet: string; urdu?: boolean }> = [
  { file: "01-ghalib-dushvar.jpg", label: "Bas-ki dushvar hai", poet: "Mirza Ghalib" },
  { file: "02-ghalib-dil-hi-to-hai.jpg", label: "Dil hi to hai", poet: "Mirza Ghalib" },
  { file: "03-ghalib-andaz-e-bayan.jpg", label: "Andaz-e-bayan aur", poet: "Mirza Ghalib" },
  { file: "04-mir-rah-e-door.jpg", label: "Rah-e-door-e-ishq", poet: "Mir Taqi Mir" },
  { file: "05-mir-dil-ki-veerani.jpg", label: "Dil ki veerani", poet: "Mir Taqi Mir" },
  { file: "06-iqbal-khudi.jpg", label: "Khudi ko kar buland", poet: "Allama Iqbal" },
  { file: "07-iqbal-na-umeed.jpg", label: "Nahin hai na-umeed", poet: "Allama Iqbal" },
  { file: "08-momin-umr-saari.jpg", label: "Umr saari to kati", poet: "Momin Khan Momin" },
  { file: "12-daagh-ghazab-kiya.jpg", label: "Ghazab kiya", poet: "Daagh Dehlvi" },
  { file: "09-urdu-ghalib-bas-ki.jpg", label: "بس کہ دشوار ہے", poet: "Mirza Ghalib", urdu: true },
  { file: "10-urdu-iqbal-sitaron-se-aage.jpg", label: "ستاروں سے آگے", poet: "Allama Iqbal", urdu: true },
  { file: "11-urdu-daagh-ghazab-kiya.jpg", label: "غضب کیا", poet: "Daagh Dehlvi", urdu: true },
];

export default function ScanPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [image, setImage] = useState<File | null>(null);
  const [script, setScript] = useState<ScriptView>("all");
  const [level, setLevel] = useState<Level>("beginner");
  const [poet, setPoet] = useState("");
  const { result, devanagariText, romanText, textHash, loading, error, analyze, reset } = useOCR();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [popupWord, setPopupWord] = useState<string | null>(null);
  const [popupMeaning, setPopupMeaning] = useState("");
  const [meaningLoading, setMeaningLoading] = useState(false);
  const [vocabSaving, setVocabSaving] = useState(false);
  const [vocabMsg, setVocabMsg] = useState<string | null>(null);

  // Object URL created once per image (was re-created on every render → leak)
  const preview = useMemo(() => (image ? URL.createObjectURL(image) : null), [image]);
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const rawUrdu = result?.rawUrdu ?? "";
  const isUrdu = result?.script === "urdu" && /[؀-ۿ]/.test(rawUrdu);
  const hasText = Boolean(devanagariText || romanText);

  const levels: TashreehLevels | null =
    result?.tashreeh == null
      ? null
      : typeof result.tashreeh === "object"
        ? result.tashreeh
        : { beginner: result.tashreeh, intermediate: result.tashreeh, scholar: result.tashreeh };
  const tashreehText = levels?.[level] ?? levels?.beginner ?? "";

  async function handleWordClick(word: string) {
    const w = word.replace(/[।,.!?؟،۔"'“”]/g, "").trim();
    if (!w) return;
    setPopupWord(w);
    setVocabMsg(null);
    setPopupMeaning("");
    setMeaningLoading(true);
    try {
      const { meaning } = await lookupDictionary(w);
      setPopupMeaning(meaning);
    } catch (err) {
      setPopupMeaning(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setMeaningLoading(false);
    }
  }

  async function handleSave() {
    if (!user || !textHash) return;
    setSaveError(null);
    setSaving(true);
    try {
      await saveHistory({
        cacheHash: textHash,
        text: devanagariText ?? rawUrdu,
        explanation: tashreehText,
        devanagariText: devanagariText ?? undefined,
        tashreeh: tashreehText || undefined,
        poet: poet || undefined,
        ocrConfidence: result?.confidence ?? 0.7,
        attributionConfidence: poet ? 1 : 0,
      });
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save to history.");
    } finally {
      setSaving(false);
    }
  }

  async function pickSample(sample: (typeof SAMPLES)[number]) {
    const blob = await (await fetch(`/samples/${sample.file}`)).blob();
    setPoet(sample.poet);
    setSaved(false);
    setImage(new File([blob], sample.file, { type: "image/jpeg" }));
  }

  function startOver() {
    setImage(null);
    reset();
  }

  const nav = { text: devanagariText ?? "", poet, cacheHash: textHash ?? "", explanation: tashreehText };

  return (
    <Page
      title="Tasveer — scan a sher"
      subtitle="Point your camera at printed Urdu or Hindi poetry. We read it, transliterate it, explain it — and read it aloud for you."
      bg="lanterns"
    >
      {!image && (
        <Card className="flex flex-col items-center gap-5">
          <ScanLine size={40} className="text-[#c26a3b]" />
          <CameraCapture onCapture={setImage} />
          <ImageUpload onSelect={setImage} />
          <div className="w-full pt-5 mt-1 border-t border-[#ecd6bd]">
            <p className="text-sm text-[#7d5b44] mb-3 text-center">No book handy? Try a sample page:</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {SAMPLES.map((s) => (
                <button
                  key={s.file}
                  type="button"
                  onClick={() => pickSample(s)}
                  className="group rounded-xl overflow-hidden border border-[#ecd6bd] bg-[#fff8f0] hover:border-[#c26a3b] text-left"
                >
                  <img src={`/samples/${s.file}`} alt={s.label} loading="lazy" className="w-full aspect-[4/5] object-cover object-center group-hover:opacity-90" />
                  <span className={`block px-2 py-1.5 text-[11px] leading-tight text-[#5a3a28] truncate ${s.urdu ? "font-urdu text-right" : ""}`} dir={s.urdu ? "rtl" : undefined}>
                    {s.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {image && preview && (
        <div className="space-y-6">
          <Card className="flex flex-col items-center gap-4">
            <img
              src={preview}
              alt="Your photo of the sher"
              className="w-full max-w-md max-h-[40vh] object-contain rounded-2xl border border-[#ecd6bd]"
            />
            <div className="flex flex-wrap justify-center gap-3">
              {!result && (
                <button
                  onClick={() => {
                    setSaved(false);
                    setSaveError(null);
                    void analyze(image);
                  }}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#c26a3b] hover:bg-[#a9552a] text-white font-medium disabled:opacity-50"
                >
                  <Sparkles size={18} />
                  {loading ? "Reading the sher…" : "Read & explain"}
                </button>
              )}
              <button
                onClick={startOver}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-full border border-[#e2c9ad] text-sm text-[#5a321c] hover:bg-[#f6e2cf]"
              >
                <RotateCcw size={16} /> Retake
              </button>
            </div>
            {loading && (
              <p className="text-xs text-[#94725a]">First scans take ~15–30 s (OCR → transliteration → 3 levels of tashreeh).</p>
            )}
            {error && <ErrorNote>{error}</ErrorNote>}
          </Card>

          {hasText && (
            <Card>
              <div className="flex flex-wrap items-center gap-3 mb-5">
                {result?.script && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#f6e2cf] text-[#5a321c]">
                    {result.script === "devanagari" ? "Hindi" : "Urdu"} poetry detected
                  </span>
                )}
                <div className="ml-auto flex items-center gap-2">
                  <label htmlFor="script" className="text-sm text-[#94725a]">Show</label>
                  <select
                    id="script"
                    value={script}
                    onChange={(e) => setScript(e.target.value as ScriptView)}
                    className="rounded-lg border border-[#e2c9ad] bg-[#fffaf4] px-3 py-1.5 text-sm"
                  >
                    <option value="all">All scripts</option>
                    <option value="dev">Devanagari</option>
                    {isUrdu && <option value="urdu">Urdu</option>}
                    <option value="roman">Roman</option>
                  </select>
                </div>
              </div>

              {isUrdu && (script === "all" || script === "urdu") && (
                <p dir="rtl" lang="ur" className="font-urdu text-2xl sm:text-3xl leading-[2.4] text-center whitespace-pre-line mb-4">
                  {rawUrdu}
                </p>
              )}
              {(script === "all" || script === "dev") && devanagariText && (
                <div lang="hi" className="font-deva text-center">
                  <PoetryText text={devanagariText} onWordClick={handleWordClick} />
                </div>
              )}
              {(script === "all" || script === "roman") && romanText && (
                <div className="mt-3 text-center italic text-[#7d5b44]">
                  <PoetryText text={romanText} onWordClick={handleWordClick} small />
                </div>
              )}
              <p className="mt-3 text-center text-xs text-[#b08a6a]">Tap any word for its meaning</p>

              {/* Point-and-speak */}
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <SpeakButton text={isUrdu ? rawUrdu : devanagariText ?? ""} label="Read it aloud" />
                <SpeakButton text={isUrdu ? rawUrdu : devanagariText ?? ""} slow label="Slowly" />
                <button
                  type="button"
                  onClick={() => navigate(`/ustad/${encodeURIComponent(textHash ?? "")}`, { state: nav })}
                  disabled={!textHash}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#c26a3b] text-white text-sm font-medium hover:bg-[#a9552a] disabled:opacity-50"
                >
                  <Mic2 size={16} /> Practice reciting
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/poetry-ai/${encodeURIComponent(textHash ?? "")}`, { state: nav })}
                  disabled={!textHash}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#e2c9ad] text-sm text-[#5a321c] hover:bg-[#f6e2cf] disabled:opacity-50"
                >
                  <Sparkles size={16} /> Ask the AI
                </button>
              </div>
            </Card>
          )}

          {tashreehText && (
            <Card>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h2 className="font-semibold text-[#5a2e14]">Tashreeh</h2>
                <div className="inline-flex rounded-full border border-[#e2c9ad] p-0.5 bg-[#fffaf4]" role="tablist">
                  {(["beginner", "intermediate", "scholar"] as Level[]).map((l) => (
                    <button
                      key={l}
                      role="tab"
                      aria-selected={level === l}
                      onClick={() => setLevel(l)}
                      className={`px-3 py-1 rounded-full text-xs capitalize ${level === l ? "bg-[#c26a3b] text-white" : "text-[#5a321c]"}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <span className="ml-auto"><SpeakButton text={tashreehText} compact /></span>
              </div>
              <p lang="hi" className="font-deva text-lg leading-relaxed text-[#3b2419] whitespace-pre-wrap">
                {tashreehText}
              </p>
              <p className="mt-3 text-xs text-[#b08a6a]">
                AI interpretation · confidence {Math.round((result?.confidence ?? 0.85) * 100)}% · other readings exist
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[#f0d9c2] pt-5">
                <label htmlFor="poet" className="text-sm text-[#94725a]">Poet</label>
                <select
                  id="poet"
                  value={poet}
                  onChange={(e) => setPoet(e.target.value)}
                  className="rounded-lg border border-[#e2c9ad] bg-[#fffaf4] px-3 py-1.5 text-sm"
                >
                  <option value="">Unknown poet</option>
                  {POETS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <button
                  onClick={handleSave}
                  disabled={saving || saved || !user}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#3b2419] text-white text-sm disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? "Saving…" : saved ? "Saved to history" : "Save to history"}
                </button>
                {!user && <span className="text-sm text-[#8a3412]">Log in to save</span>}
              </div>
              {saveError && <ErrorNote>{saveError}</ErrorNote>}
            </Card>
          )}
        </div>
      )}

      {popupWord != null && (
        <WordModal
          word={popupWord}
          meaning={popupMeaning}
          meaningLoading={meaningLoading}
          saving={vocabSaving}
          status={vocabMsg}
          onSave={async () => {
            setVocabSaving(true);
            try {
              await saveVocabulary(popupWord, popupMeaning);
              setVocabMsg("Saved to your deck ✓");
              setTimeout(() => setPopupWord(null), 700);
            } catch (err) {
              setVocabMsg(err instanceof Error ? err.message : "Could not save");
            } finally {
              setVocabSaving(false);
            }
          }}
          onClose={() => setPopupWord(null)}
        />
      )}
    </Page>
  );
}
