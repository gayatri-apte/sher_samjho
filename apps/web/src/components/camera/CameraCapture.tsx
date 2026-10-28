import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";

type Props = {
  onCapture: (file: File) => void;
};

export default function CameraCapture({ onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActive(false);
  }

  // Always release the camera when leaving the page (it used to stay on).
  useEffect(() => stopCamera, []);

  async function startCamera() {
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 } },
      });
      streamRef.current = s;
      setActive(true);
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = s;
      });
    } catch {
      setError("Camera access denied or unavailable — use Upload instead.");
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stopCamera();
        onCapture(new File([blob], "scan.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {error && <p className="text-sm text-[#8a2a1a]">{error}</p>}

      {!active ? (
        <button
          type="button"
          onClick={startCamera}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#c26a3b] hover:bg-[#a9552a] text-white font-semibold shadow-md shadow-[#c26a3b]/30"
        >
          <Camera size={18} /> Open camera
        </button>
      ) : (
        <>
          <div className="w-full max-w-md rounded-2xl overflow-hidden border border-[#ecd6bd] bg-black">
            <video ref={videoRef} autoPlay playsInline muted className="w-full" />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={capturePhoto}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#c26a3b] text-white font-medium"
            >
              <Camera size={16} /> Capture
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#e2c9ad] text-[#5a321c]"
            >
              <X size={16} /> Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
