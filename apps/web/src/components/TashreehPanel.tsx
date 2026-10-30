import { useEffect, useState } from "react";
import { Languages } from "lucide-react";
import SpeakButton from "./voice/SpeakButton";
import { ErrorNote } from "./ui/Page";
import { api } from "../config/api";
import { apiJSON } from "../lib/http";

export type Level = "beginner" | "intermediate" | "scholar";

/** Explanation languages (must match functions/src/prompts/tashreeh.lang.ts). */
const EXPLAIN_LANGUAGES: Array<{ code: string; label: string; dir?: "rtl"; font?: string }> = [
  { code: "hi", label: "हिन्दी", font: "font-deva" },
  { code: "en", label: "English" },
  { code: "mr", label: "मराठी", font: "font-deva" },
  { code: "gu", label: "ગુજરાતી" },
  { code: "pa", label: "ਪੰਜਾਬੀ" },
  { code: "bn", label: "বাংলা" },
  { code: "te", label: "తెలుగు" },
  { code: "ta", label: "தமிழ்" },
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "ml", label: "മലയാളം" },
  { code: "ur", label: "اردو", dir: "rtl", font: "font-urdu" },
];

const LANG_KEY = "sher.explainLang";

function savedLang(): string {
  try {
    const v = localStorage.getItem(LANG_KEY);
    return v && EXPLAIN_LANGUAGES.some((l) => l.code === v) ? v : "hi";
  } catch {
    return "hi";
  }
}

type Props = {
  /** The sher in Devanagari. */
  text: string;
  /** Sher id / text hash — lets the server cache each explanation. */
  textHash?: string | null;
  /** Hindi explanations already known (from the scan or the library). */
  initial?: Partial<Record<Level, string>> | string | null;
  /** Called whenever the visible explanation changes (e.g. to save it). */
  onShown?: (text: string) => void;
};

/**
 * Tashreeh with three depths and eleven languages. Anything not already
 * known is written on demand by the AI and cached on the server, so the
 * next reader gets it instantly.
 */
export default function TashreehPanel({ text, textHash, initial, onShown }: Props) {
  const [lang, setLang] = useState(savedLang);
  const [level, setLevel] = useState<Level>("beginner");
  const [known, setKnown] = useState<Record<string, string>>(() => {
    const init = typeof initial === "string" ? { beginner: initial } : initial ?? {};
    return Object.fromEntries(
      Object.entries(init).filter(([, v]) => v).map(([k, v]) => [`hi|${k}`, v as string]),
    );
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const key = `${lang}|${level}`;
  const shown = known[key] ?? "";
  const error = errors[key] ?? null;
  const loading = !shown && !error && Boolean(text.trim());
  const meta = EXPLAIN_LANGUAGES.find((l) => l.code === lang) ?? EXPLAIN_LANGUAGES[0];

  useEffect(() => {
    if (shown) onShown?.(shown);
  }, [shown, onShown]);

  useEffect(() => {
    if (known[key] || errors[key] || !text.trim()) return;
    let cancelled = false;
    apiJSON<{ explanation: string }>(api.tashreeh, {
      body: { text, level, lang, textHash: textHash || undefined },
    })
      .then((r) => !cancelled && setKnown((k) => ({ ...k, [key]: r.explanation })))
      .catch((e) => !cancelled && setErrors((x) => ({
        ...x, [key]: e instanceof Error ? e.message : "Could not write the explanation",
      })));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, text, textHash]);

  function retry() {
    setErrors((x) => {
      const n = { ...x };
      delete n[key];
      return n;
    });
  }

  function chooseLang(code: string) {
    setLang(code);
    try {
      localStorage.setItem(LANG_KEY, code);
    } catch {
      /* private mode: fine, just not remembered */
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <h2 className="font-semibold text-[#5a2e14] mr-1">Tashreeh</h2>
        <div className="inline-flex rounded-full border border-[#e2c9ad] p-0.5 bg-[#fffaf4]" role="tablist" aria-label="Depth">
          {(["beginner", "intermediate", "scholar"] as Level[]).map((l) => (
            <button
              key={l}
              type="button"
              role="tab"
              aria-selected={level === l}
              onClick={() => setLevel(l)}
              className={`px-3 py-1 rounded-full text-xs capitalize ${level === l ? "bg-[#c26a3b] text-white" : "text-[#5a321c]"}`}
            >
              {l}
            </button>
          ))}
        </div>
        <label className="inline-flex items-center gap-1.5 rounded-full border border-[#e2c9ad] bg-[#fffaf4] pl-2.5 pr-1 py-0.5 text-xs text-[#5a321c]">
          <Languages size={14} aria-hidden />
          <span className="sr-only">Explanation language</span>
          <select
            value={lang}
            onChange={(e) => chooseLang(e.target.value)}
            className="bg-transparent py-1 pr-1 focus:outline-none"
          >
            {EXPLAIN_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </label>
        {shown && !loading && (
          <span className="ml-auto"><SpeakButton text={shown} lang={lang} compact /></span>
        )}
      </div>

      {loading ? (
        <p className="text-[#94725a] animate-pulse">
          Writing the {level} explanation in {meta.label}…
        </p>
      ) : shown ? (
        <p
          lang={lang}
          dir={meta.dir}
          className={`${meta.font ?? ""} text-lg leading-relaxed text-[#3b2419] whitespace-pre-wrap ${meta.dir ? "text-right" : ""}`}
        >
          {shown}
        </p>
      ) : null}
      {error && (
        <ErrorNote>
          {error}{" "}
          <button type="button" onClick={retry} className="underline">Try again</button>
        </ErrorNote>
      )}
      <p className="mt-3 text-xs text-[#b08a6a]">AI interpretation · other readings exist</p>
    </div>
  );
}
