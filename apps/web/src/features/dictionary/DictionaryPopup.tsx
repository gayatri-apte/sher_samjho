type Props = {
  word: string;
  meaning: string;
  onSave: () => void;
  onClose: () => void;
  saving?: boolean;
  /** When true, meaning is still loading and save should be disabled. */
  meaningLoading?: boolean;
};

export default function DictionaryPopup({
  word,
  meaning,
  onSave,
  onClose,
  saving = false,
  meaningLoading = false,
}: Props) {
  const saveDisabled = saving || meaningLoading;

  return (
    <div className="fixed bottom-6 inset-x-4 bg-neutral-900 p-4 rounded-xl border border-neutral-700 shadow-xl z-50 max-w-lg mx-auto">
      <div className="flex justify-between items-start">
        <h3 className="text-xl font-semibold text-neutral-100">{word}</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-neutral-400 hover:text-neutral-200 p-1"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <p className="mt-2 text-neutral-300 text-sm leading-relaxed">{meaning}</p>

      <button
        type="button"
        onClick={onSave}
        disabled={saveDisabled}
        className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        title={meaningLoading ? "Wait for definition to load" : undefined}
      >
        {saving ? "Saving…" : meaningLoading ? "Loading definition…" : "Save to Vocabulary"}
      </button>
    </div>
  );
}
