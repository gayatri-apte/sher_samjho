import { useState } from "react";
import WordModal from "./WordModal";
import { lookupDictionary, saveVocabulary } from "../services/functions.service";

/**
 * Renders a sher with every word tappable: tap → meaning popup →
 * "Add to practice deck" (SM-2). Used everywhere a sher is shown so the
 * deck can be filled from any sher, not only from a fresh scan.
 */
export default function TappableSher({ text, className = "" }: { text: string; className?: string }) {
  const [word, setWord] = useState<string | null>(null);
  const [meaning, setMeaning] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function open(raw: string) {
    const w = raw.replace(/[^\p{L}\p{M}]/gu, "");
    if (!w) return;
    setWord(w);
    setMeaning("");
    setStatus(null);
    setLoading(true);
    try {
      setMeaning((await lookupDictionary(w)).meaning);
    } catch (e) {
      setMeaning(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!word) return;
    setSaving(true);
    try {
      await saveVocabulary(word, meaning);
      setStatus("Added to your practice deck ✓");
      setTimeout(() => setWord(null), 800);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div lang="hi" className={`font-deva whitespace-pre-wrap break-words ${className}`}>
        {text.split("\n").map((line, i) => (
          <div key={i}>
            {line.split(/(\s+)/).map((tok, j) =>
              /^\s+$/.test(tok) || !tok ? (
                tok
              ) : (
                <button
                  key={j}
                  type="button"
                  onClick={() => open(tok)}
                  className="rounded-md px-0.5 hover:bg-[#f6e2cf] focus:bg-[#f6e2cf] focus:outline-none transition-colors"
                  title="Tap for meaning"
                >
                  {tok}
                </button>
              ),
            )}
          </div>
        ))}
      </div>
      {word != null && (
        <WordModal
          word={word}
          meaning={meaning}
          meaningLoading={loading}
          saving={saving}
          status={status}
          onSave={save}
          onClose={() => setWord(null)}
        />
      )}
    </>
  );
}
