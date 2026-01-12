export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] gap-6 px-4 text-center">
      <h1 className="text-4xl font-bold">Sher Samjho 📖</h1>

      <p className="max-w-xl text-neutral-400">
        Scan Urdu poetry and instantly understand meaning, transliteration,
        vocabulary, and deeper interpretation.
      </p>

      <div className="flex gap-4">
        <a
          href="/scan"
          className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition"
        >
          Scan Poetry
        </a>

        <a
          href="/login"
          className="px-6 py-3 rounded-lg border border-neutral-700 hover:bg-neutral-800 transition"
        >
          Login
        </a>
      </div>
    </div>
  );
}
