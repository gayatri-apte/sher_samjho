import {Link, useLocation, useNavigate} from "react-router-dom";

export default function ReaderPage() {
  const navigate = useNavigate();
  const {state} = useLocation() as {
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
  const sherId =
    state?.cacheHash && typeof state.cacheHash === "string"
      ? state.cacheHash
      : undefined;

  if (!text) {
    return (
      <div
        className="min-h-screen text-[#6b4a33] flex flex-col px-6 py-8 relative bg-cover bg-no-repeat bg-center"
        style={{backgroundImage: "url('/images/background-lanterns.png')"}}
      >
        <div className="absolute top-6 left-6">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#e2c9ad] bg-[#fff7ef] text-[#c26a3b] hover:bg-[#f6e2cf] hover:text-[#a9552a] text-sm font-medium transition-colors"
          >
            <span aria-hidden>←</span>
            <span>Back to Home</span>
          </button>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 flex-1">
          <p>No text to read yet.</p>
          <p className="text-sm text-center max-w-sm text-[#94725a]">
            Open a sher from{" "}
            <Link to="/search" className="text-[#c26a3b] hover:underline">Search</Link> or{" "}
            <Link to="/history" className="text-[#c26a3b] hover:underline">History</Link> to read it here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-[calc(100vh-64px)] text-[#3b2419] flex flex-col px-4 sm:px-8 py-6 sm:py-10 bg-cover bg-no-repeat bg-center"
      style={{backgroundImage: "url('/images/background-pattern-soft.png')"}}
    >
      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#e2c9ad] bg-[#fff7ef] text-[#c26a3b] hover:bg-[#f6e2cf] hover:text-[#a9552a] text-sm font-medium transition-colors"
          >
            <span aria-hidden>←</span>
            <span>Back</span>
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full text-center">
            <p className="text-[11px] tracking-[0.3em] uppercase text-[#b08a6a] mb-4">
              Reading mode
            </p>
            <div className="rounded-3xl bg-[#fff7ef] border border-[#e2c9ad] px-6 sm:px-10 py-10 sm:py-16 shadow-md">
              <div className="whitespace-pre-wrap break-words text-3xl sm:text-4xl md:text-5xl leading-relaxed font-semibold tracking-wide">
                {text}
              </div>
            </div>

            {sherId && (
              <button
                type="button"
                onClick={() =>
                  navigate(`/poetry-ai/${encodeURIComponent(sherId)}`, {
                    state,
                  })
                }
                className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e2c9ad] bg-[#fff7ef] text-[#c26a3b] hover:bg-[#f6e2cf] hover:text-[#a9552a] text-sm font-medium transition-colors"
              >
                <span>Ask the AI about this sher</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
