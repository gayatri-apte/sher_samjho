import { useCallback, useEffect, useRef, useState } from "react";
import { blobToBase64, blobToWav16k } from "./wav";

export type Recording = {
  base64: string; // WAV, 16 kHz mono
  mimeType: "audio/wav";
  url: string; // object URL for playback
  seconds: number;
};

/**
 * Microphone recorder with a live input level and an auto-stop limit.
 * stop() resolves with a WAV recording ready to send to the voice API.
 */
export function useVoiceRecorder(maxSeconds = 45) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  const rafRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const resolverRef = useRef<((r: Recording | null) => void) | null>(null);

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (tickRef.current) window.clearInterval(tickRef.current);
    rafRef.current = null;
    tickRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void ctxRef.current?.close().catch(() => undefined);
    ctxRef.current = null;
    setLevel(0);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const stop = useCallback((): Promise<Recording | null> => {
    const rec = recRef.current;
    if (!rec || rec.state !== "recording") return Promise.resolve(null);
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      rec.stop();
    });
  }, []);

  const start = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser can't record audio. Try Chrome or Safari.");
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      // live level meter
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      const loop = () => {
        analyser.getByteTimeDomainData(data);
        let peak = 0;
        for (const v of data) peak = Math.max(peak, Math.abs(v - 128));
        setLevel(Math.min(1, peak / 64));
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();

      const rec = new MediaRecorder(stream);
      recRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        const secs = (Date.now() - startedAt.current) / 1000;
        cleanup();
        setRecording(false);
        const resolve = resolverRef.current;
        resolverRef.current = null;
        try {
          const raw = new Blob(chunksRef.current, { type: rec.mimeType });
          const wav = await blobToWav16k(raw);
          const base64 = await blobToBase64(wav);
          resolve?.({
            base64,
            mimeType: "audio/wav",
            url: URL.createObjectURL(wav),
            seconds: secs,
          });
        } catch {
          setError("Could not process the recording. Please try again.");
          resolve?.(null);
        }
      };

      startedAt.current = Date.now();
      setSeconds(0);
      tickRef.current = window.setInterval(() => {
        const s = (Date.now() - startedAt.current) / 1000;
        setSeconds(s);
        if (s >= maxSeconds && rec.state === "recording") rec.stop();
      }, 200);
      rec.start();
      setRecording(true);
      return true;
    } catch {
      cleanup();
      setError("Microphone permission denied. Allow the mic and try again.");
      return false;
    }
  }, [cleanup, maxSeconds]);

  return { recording, seconds, level, error, start, stop };
}
