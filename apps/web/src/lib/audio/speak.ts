import { api } from "../../config/api";

const cache = new Map<string, string>();
let current: HTMLAudioElement | null = null;

/** Stops whatever is currently being spoken. */
export function stopSpeaking() {
  current?.pause();
  current = null;
}

/**
 * Speaks text through the backend TTS (Urdu/Hindi voice picked by script).
 * rate 0.6 = slow learner mode. Resolves when playback ends.
 */
export async function speak(text: string, rate = 0.9): Promise<void> {
  const clean = text.trim();
  if (!clean) return;
  stopSpeaking();
  const key = `${rate}|${clean}`;
  let url = cache.get(key);
  if (!url) {
    const res = await fetch(api.tts, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: clean, rate }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || "Could not play audio");
    }
    url = URL.createObjectURL(await res.blob());
    cache.set(key, url);
  }
  const audio = new Audio(url);
  current = audio;
  await new Promise<void>((resolve, reject) => {
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error("Playback failed"));
    audio.play().catch(reject);
  });
}
