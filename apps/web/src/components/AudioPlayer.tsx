import {useRef, useState} from "react";
import {api} from "../config/api";

export default function AudioPlayer({text}: {text: string}) {
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
      <button
        onClick={play}
        className="px-4 py-2 bg-purple-600 rounded"
      >
        {loading ? "Loading..." : "Play Recitation"}
      </button>

      <audio ref={audioRef} controls className="mt-3 w-full" />
    </div>
  );
}
