import {useRef, useState, type ReactNode} from "react";
import {api} from "../config/api";

export default function AudioPlayer({
  text,
  secondaryControl,
}: {
  text: string;
  secondaryControl?: ReactNode;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [loading, setLoading] = useState(false);

  async function play() {
    setLoading(true);

    const res = await fetch(api.tts, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({text}),
    });

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play();
    }

    setLoading(false);
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={play}
          className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-[#d18a4c] hover:bg-[#b96f35] text-sm font-semibold text-white shadow-sm transition-colors"
        >
          {loading ? "Loading..." : "Play Recitation"}
        </button>
        {secondaryControl}
      </div>

      <audio ref={audioRef} controls className="mt-3 w-full h-9" />
    </div>
  );
}
