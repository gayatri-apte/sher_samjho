import { Link, useLocation } from "react-router-dom";

export default function ReaderPage() {
  const { state } = useLocation();
  const text = state?.text;

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
    <div className="min-h-screen bg-black text-neutral-100 px-12 py-20 text-2xl leading-loose tracking-wide whitespace-pre-wrap font-serif">
      {text}
    </div>
  );
}
