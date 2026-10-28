import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mic2, Sparkles } from "lucide-react";
import SpeakButton from "../../components/voice/SpeakButton";

export default function ReaderPage() {
  const navigate = useNavigate();
  const { state } = useLocation() as {
    state?: {
      text?: string;
      cacheHash?: string;
      explanation?: string;
      tashreeh?: string;
      poet?: string;
      ocrConfidence?: number;
      attributionConfidence?: number;
    };
  };
  const text = state?.text?.trim() ?? "";
  const sherId = typeof state?.cacheHash === "string" && state.cacheHash ? state.cacheHash : undefined;
  const explanation = state?.explanation ?? state?.tashreeh ?? "";

  if (!text) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4 px-6 text-[#6b4a33] bg-[#f8eee3]">
        <p>No text to read yet.</p>
        <p className="text-sm text-center max-w-sm text-[#94725a]">
          Open a sher from <Link to="/search" className="text-[#c26a3b] hover:underline">Search</Link>,{" "}
          <Link to="/history" className="text-[#c26a3b] hover:underline">History</Link> or{" "}
          <Link to="/feed" className="text-[#c26a3b] hover:underline">today's sher</Link>.
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-[calc(100vh-4rem)] text-[#3b2419] px-4 sm:px-8 py-8 sm:py-12 bg-cover bg-no-repeat bg-center"
      style={{ backgroundImage: "url('/images/background-pattern-soft.png')" }}
    >
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-[11px] tracking-[0.3em] uppercase text-[#b08a6a] mb-4">Reading mode</p>
        <div className="rounded-3xl bg-[#fff7ef] border border-[#e2c9ad] px-6 sm:px-10 py-10 sm:py-16 shadow-md">
          <div lang="hi" className="font-deva whitespace-pre-wrap break-words text-3xl sm:text-4xl md:text-5xl leading-relaxed font-semibold">
            {text}
          </div>
          {state?.poet && <p className="mt-6 text-[#94725a]">— {state.poet}</p>}
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <SpeakButton text={text} label="Listen" />
          <SpeakButton text={text} slow label="Slow" />
          {sherId && (
            <>
              <button
                type="button"
                onClick={() => navigate(`/ustad/${encodeURIComponent(sherId)}`, { state })}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#c26a3b] text-white text-sm font-medium hover:bg-[#a9552a]"
              >
                <Mic2 size={16} /> Recite with Ustad
              </button>
              <button
                type="button"
                onClick={() => navigate(`/poetry-ai/${encodeURIComponent(sherId)}`, { state })}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#e2c9ad] bg-[#fff7ef] text-[#5a321c] text-sm font-medium hover:bg-[#f6e2cf]"
              >
                <Sparkles size={16} /> Ask the AI
              </button>
            </>
          )}
        </div>

        {explanation && (
          <div className="mt-8 text-left rounded-3xl bg-[#fff7ef]/95 border border-[#e2c9ad] px-6 py-5">
            <h2 className="font-semibold text-[#5a2e14] mb-2">Tashreeh</h2>
            <p lang="hi" className="font-deva leading-relaxed text-[#5a3a28] whitespace-pre-wrap">{explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}
