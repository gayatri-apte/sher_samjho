import { Mic, Square, Loader2 } from "lucide-react";
import { useVoiceRecorder, type Recording } from "../../lib/audio/useVoiceRecorder";

type Props = {
  onRecorded: (r: Recording) => void | Promise<void>;
  busy?: boolean;
  label?: string;
  busyLabel?: string;
  maxSeconds?: number;
  size?: "md" | "lg";
};

/**
 * Tap to record, tap to stop. Shows a live level meter and timer.
 * Hands back a 16 kHz WAV recording.
 */
export default function MicButton({
  onRecorded,
  busy = false,
  label = "Tap to speak",
  busyLabel = "Listening closely…",
  maxSeconds = 45,
  size = "md",
}: Props) {
  const { recording, seconds, level, error, start, stop } =
    useVoiceRecorder(maxSeconds);

  async function toggle() {
    if (busy) return;
    if (recording) {
      const r = await stop();
      if (r) await onRecorded(r);
    } else {
      await start();
    }
  }

  const dim = size === "lg" ? "w-24 h-24" : "w-14 h-14";
  const icon = size === "lg" ? 36 : 22;
  const ring = 1 + level * 0.35;

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-label={recording ? "Stop recording" : label}
        aria-pressed={recording}
        className={`relative ${dim} rounded-full flex items-center justify-center text-white shadow-lg transition-colors disabled:opacity-60 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#c26a3b]/40 ${
          recording ? "bg-[#9b2c2c]" : "bg-[#c26a3b] hover:bg-[#a9552a]"
        }`}
      >
        {recording && (
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-[#9b2c2c]/30 transition-transform duration-75"
            style={{ transform: `scale(${ring})` }}
          />
        )}
        <span className="relative">
          {busy ? (
            <Loader2 size={icon} className="animate-spin" />
          ) : recording ? (
            <Square size={icon - 4} fill="currentColor" />
          ) : (
            <Mic size={icon} />
          )}
        </span>
      </button>
      <span className="text-xs text-[#94725a] min-h-4 tabular-nums" aria-live="polite">
        {busy
          ? busyLabel
          : recording
            ? `Recording… ${seconds.toFixed(0)}s — tap to stop`
            : label}
      </span>
      {error && (
        <span className="text-xs text-[#9b2c2c] text-center max-w-xs" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
