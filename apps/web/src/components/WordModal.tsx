import { useEffect } from "react";
import { X } from "lucide-react";
import SpeakButton from "./voice/SpeakButton";

type Props = {
  word: string;
  meaning: string;
  onSave: () => void;
  onClose: () => void;
  saving?: boolean;
  meaningLoading?: boolean;
  status?: string | null;
};

export default function WordModal({
  word,
  meaning,
  onSave,
  onClose,
  saving = false,
  meaningLoading = false,
  status,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-[#2b160b]/50 flex items-end sm:items-center justify-center z-50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Meaning of ${word}`}
        className="bg-[#fff8f0] border border-[#ecd6bd] p-6 rounded-3xl w-full max-w-sm shadow-2xl text-[#3b2419]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start gap-3 mb-2">
          <div className="flex items-center gap-2">
            <h2 className="font-deva text-3xl">{word}</h2>
            <SpeakButton text={word} compact />
            <SpeakButton text={word} slow compact />
          </div>
          <button type="button" onClick={onClose} className="p-1 text-[#94725a] hover:text-[#3b2419]" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <p className="text-[#5a3a28] mb-5 min-h-6">{meaningLoading ? "Looking it up…" : meaning}</p>
        <button
          onClick={onSave}
          disabled={saving || meaningLoading}
          className="w-full py-2.5 rounded-full bg-[#c26a3b] hover:bg-[#a9552a] text-white text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Saving…" : "Add to practice deck"}
        </button>
        {status && <p className="mt-2 text-center text-sm text-[#5a3a28]">{status}</p>}
      </div>
    </div>
  );
}
