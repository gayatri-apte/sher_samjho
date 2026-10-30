import { useNavigate } from "react-router-dom";
import { Mic2, Sparkles } from "lucide-react";
import SpeakButton from "./voice/SpeakButton";
import { sherState, tashreehText, type Sher } from "../lib/http";

/** One sher in a list: text, poet, meaning preview and quick actions. */
export default function SherCard({ sher, showMeaning = true }: { sher: Sher; showMeaning?: boolean }) {
  const navigate = useNavigate();
  const meaning = tashreehText(sher.tashreeh);
  const open = () => navigate(`/poetry-ai/${sher.id}`, { state: sherState(sher) });

  return (
    <article className="group rounded-2xl border border-[#ecd6bd] bg-[#fff8f0] p-5 transition-shadow hover:shadow-md">
      <button type="button" onClick={open} className="w-full text-left focus:outline-none">
        <p lang="hi" className="font-deva text-lg sm:text-xl leading-relaxed whitespace-pre-line text-[#3b2419]">
          {sher.devanagariText}
        </p>
        {sher.poet && sher.poet !== "Unknown" && (
          <p className="mt-2 text-sm text-[#94725a]">— {sher.poet}</p>
        )}
        {showMeaning && meaning && (
          <p lang="hi" className="mt-3 font-deva text-sm text-[#7d5b44] line-clamp-2">{meaning}</p>
        )}
      </button>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <SpeakButton text={sher.devanagariText ?? ""} compact />
        <button
          type="button"
          onClick={() => navigate(`/ustad/${sher.id}`)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#c26a3b] text-white hover:bg-[#a9552a]"
        >
          <Mic2 size={13} /> Recite
        </button>
        <button
          type="button"
          onClick={open}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-[#e2c9ad] text-[#5a321c] hover:bg-[#f6e2cf]"
        >
          <Sparkles size={13} /> Meaning & AI
        </button>
        {typeof sher.score === "number" && sher.score > 0 && sher.score <= 1 && (
          <span className="ml-auto text-[11px] text-[#b08a6a]">{Math.round(sher.score * 100)}% match</span>
        )}
      </div>
    </article>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#e2c9ad] bg-[#fff8f0]/70 px-6 py-10 text-center">
      <p className="font-medium text-[#5a2e14]">{title}</p>
      {children && <div className="mt-2 text-sm text-[#7d5b44]">{children}</div>}
    </div>
  );
}

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-28 rounded-2xl bg-[#f3e4d3] animate-pulse" />
      ))}
    </div>
  );
}
