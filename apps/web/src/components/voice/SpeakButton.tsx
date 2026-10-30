import { useState } from "react";
import { Volume2, Loader2, Snail } from "lucide-react";
import { speak } from "../../lib/audio/speak";

type Props = {
  text: string;
  label?: string;
  slow?: boolean;
  compact?: boolean;
  className?: string;
  /** Explanation language code (e.g. mr, te) so the right voice is used. */
  lang?: string;
};

/** Plays text aloud via the backend TTS (normal or slow learner mode). */
export default function SpeakButton({
  text,
  label,
  slow = false,
  compact = false,
  className = "",
  lang,
}: Props) {
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const [err, setErr] = useState<string | null>(null);

  async function play() {
    setErr(null);
    setState("loading");
    try {
      const p = speak(text, slow ? 0.6 : 0.9, lang);
      setState("playing");
      await p;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Audio failed");
    } finally {
      setState("idle");
    }
  }

  const Icon = state === "loading" ? Loader2 : slow ? Snail : Volume2;
  const text_ = label ?? (slow ? "Slow" : "Listen");

  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        onClick={play}
        disabled={!text.trim() || state !== "idle"}
        title={slow ? "Listen slowly" : "Listen"}
        aria-label={`${text_}: ${text.slice(0, 40)}`}
        className={
          compact
            ? `inline-flex items-center justify-center w-8 h-8 rounded-full text-[#a9552a] hover:bg-[#f6e2cf] disabled:opacity-50 ${className}`
            : `inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#fff3e4] border border-[#e2c9ad] text-sm font-medium text-[#5a321c] hover:bg-[#f6e2cf] disabled:opacity-60 transition-colors ${className}`
        }
      >
        <Icon size={compact ? 16 : 16} className={state === "loading" ? "animate-spin" : ""} />
        {!compact && <span>{state === "playing" ? "Playing…" : text_}</span>}
      </button>
      {err && !compact && <span className="text-xs text-[#9b2c2c] mt-1">{err}</span>}
    </span>
  );
}
