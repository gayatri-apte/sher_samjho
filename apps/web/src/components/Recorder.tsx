import {useRef, useState} from "react";
import {api} from "../config/api";
import {auth} from "../services/firebase";

export default function Recorder({sherId}: {sherId: string}) {
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: true});
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorder.current = recorder;

      const chunks: Blob[] = [];

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (chunks.length === 0) {
          setUploading(false);
          return;
        }
        const blob = new Blob(chunks, {type: "audio/webm"});
        const reader = new FileReader();
        reader.onloadend = async () => {
          const dataUrl = reader.result as string;
          const base64 = dataUrl.split(",")[1];
          if (!base64) {
            setUploading(false);
            return;
          }
          const token = await auth.currentUser?.getIdToken(true);
          if (!token) {
            setError("You must be signed in to save a recitation.");
            setUploading(false);
            return;
          }
          try {
            const res = await fetch(api.uploadRecitation, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({sherId, audioBase64: base64}),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              setError(data?.error ?? "Upload failed");
            }
          } catch {
            setError("Network error. Please try again.");
          }
          setUploading(false);
        };
        reader.readAsDataURL(blob);
      };

      recorder.start();
      setRecording(true);
    } catch (err) {
      setError("Could not access microphone. Check permissions.");
      setRecording(false);
    }
  }

  function stopRecording() {
    if (mediaRecorder.current?.state === "recording") {
      setUploading(true);
      mediaRecorder.current.stop();
      mediaRecorder.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setRecording(false);
  }

  return (
    <div>
      {error && (
        <p className="text-[#b35c3a] text-sm mb-2" role="alert">
          {error}
        </p>
      )}
      {!recording ? (
        <button
          type="button"
          onClick={startRecording}
          disabled={uploading}
          className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-[#f6d3b5] hover:bg-[#ecbf98] disabled:opacity-50 text-sm font-medium text-[#5a321c] shadow-sm transition-colors"
        >
          {uploading ? "Saving…" : "Record Recitation"}
        </button>
      ) : (
        <button
          type="button"
          onClick={stopRecording}
          className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-[#5a321c] hover:bg-[#3e2213] text-white text-sm font-medium shadow-sm transition-colors"
        >
          Stop
        </button>
      )}
    </div>
  );
}
