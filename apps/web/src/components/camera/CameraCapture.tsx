import { useRef, useState } from "react";

type Props = {
  onCapture: (file: File) => void;
};

export default function CameraCapture({ onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCamera() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      setStream(mediaStream);
    } catch {
      setError("Camera access denied or unavailable");
    }
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "scan.jpg", { type: "image/jpeg" });
      onCapture(file);
    }, "image/jpeg");
  }

  function stopCamera() {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {error && <p className="text-red-400">{error}</p>}

      {!stream && (
        <button
          onClick={startCamera}
          className="px-5 py-2.5 rounded-xl bg-[#c26a3b] hover:bg-[#a9552a] text-white text-sm font-semibold shadow-md shadow-[#c26a3b]/30"
        >
          Open Camera
        </button>
      )}
    <div className="w-full max-w-md rounded-xl overflow-hidden border border-neutral-700">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="rounded-xl max-w-full"
      />
      </div>

      {stream && (
        <div className="flex gap-4">
          <button
            onClick={capturePhoto}
            className="px-4 py-2 rounded bg-green-600 hover:bg-green-700"
          >
            Capture
          </button>

          <button
            onClick={stopCamera}
            className="px-4 py-2 rounded bg-neutral-700 hover:bg-neutral-600"
          >
            Stop
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
