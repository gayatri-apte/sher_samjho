export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
      {/* Hero Card */}
      <div className="w-full max-w-3xl rounded-2xl border border-neutral-800 bg-neutral-900/70 backdrop-blur-xl shadow-2xl p-10">
        
        {/* Title */}
        <h1 className="text-5xl font-bold tracking-tight text-white mb-6">
          Sher Samjho
          <span className="block text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text">
            Poetry, Explained
          </span>
        </h1>

        {/* Description */}
        <p className="text-lg text-neutral-400 max-w-2xl leading-relaxed mb-10">
          Scan Urdu poetry and instantly understand its meaning,
          transliteration, vocabulary, and deeper literary interpretation —
          designed for learners and poetry lovers.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => (window.location.href = "/scan")}
            className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 transition-all duration-200 text-white font-semibold shadow-lg shadow-blue-600/25"
          >
            Scan Poetry
          </button>

          <button
            onClick={() => (window.location.href = "/login")}
            className="px-8 py-4 rounded-xl border border-neutral-700 text-neutral-200 hover:bg-neutral-800 transition-all duration-200 font-semibold"
          >
            Login
          </button>
        </div>

        {/* Divider */}
        <div className="my-10 h-px bg-neutral-800" />

        {/* Footer Info */}
        <div className="flex flex-wrap gap-6 text-sm text-neutral-500">
          <span>Instant Meaning</span>
          <span>Vocabulary Breakdown</span>
          <span>Literary Insight</span>
        </div>
      </div>
    </div>
  );
}
