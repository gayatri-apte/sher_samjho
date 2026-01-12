import { useState } from "react";
import CameraCapture from "../../components/camera/CameraCapture";
import ImageUpload from "../../components/camera/ImageUpload";

export default function ScanPage() {
  const [image, setImage] = useState<File | null>(null);

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] gap-6 px-4">
      <h2 className="text-3xl font-semibold">Scan Poetry</h2>

      {!image && (
        <>
          <CameraCapture onCapture={setImage} />
          <ImageUpload onSelect={setImage} />
        </>
      )}

      {image && (
        <>
          <img
            src={URL.createObjectURL(image)}
            alt="preview"
            className="max-w-md rounded-xl border border-neutral-700"
          />

          <button
            disabled
            className="px-6 py-3 rounded bg-blue-600 opacity-50 cursor-not-allowed"
          >
            Analyze (OCR coming next)
          </button>

          <p className="text-sm text-neutral-400">
            Image captured successfully. Analysis will start in the next phase.
          </p>

          <button
            onClick={() => setImage(null)}
            className="text-sm text-neutral-400 hover:text-neutral-200"
          >
            Retake
          </button>
        </>
      )}
    </div>
  );
}
