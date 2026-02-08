type Props = {
  word: string;
  meaning: string;
  onSave: () => void;
  onClose: () => void;
  saving?: boolean;
  meaningLoading?: boolean;
};

export default function WordModal({
  word,
  meaning,
  onSave,
  onClose,
  saving = false,
  meaningLoading = false,
}: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-neutral-900 p-6 rounded-xl w-96 max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-2xl">{word}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 p-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <p className="text-neutral-300 mb-4">{meaning}</p>

        <button
          onClick={onSave}
          disabled={saving || meaningLoading}
          className="w-full py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : meaningLoading ? "Loading…" : "Save Word"}
        </button>
      </div>
    </div>
  );
}
