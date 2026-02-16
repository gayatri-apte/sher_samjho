import {useState} from "react";

type Props = {
  text: string;
  poet?: string;
};

export default function ShareCard({text, poet}: Props) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function share() {
    try {
      setError(null);
      const content = poet && poet.trim() !== "" ? `${text} — ${poet}` : text;
      
      if (!navigator.clipboard) {
        // Fallback for browsers without clipboard API
        const textArea = document.createElement("textarea");
        textArea.value = content;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      } else {
        await navigator.clipboard.writeText(content);
      }
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      setError("Failed to copy. Please try again.");
      setTimeout(() => setError(null), 3000);
    }
  }

  if (!text) return null;

  return (
    <div className="mt-6">
      <button
        onClick={share}
        className="px-4 py-2 bg-white text-black rounded hover:bg-neutral-100 transition-colors"
      >
        {copied ? "✓ Copied!" : "Share Quote"}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

