import { useState } from "react";
import CameraCapture from "../../components/camera/CameraCapture";
import ImageUpload from "../../components/camera/ImageUpload";
import { sendImageForOCR } from "../../features/ocr/ocr.service";


export default function ScanPage() {
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

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
            onClick={async () => {
              if (!image) return;
              setLoading(true);
              setError(null);
              setText("");
              try {
                const extracted = await sendImageForOCR(image);
                setText(extracted);
              } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "OCR failed. Please try again.";
                setError(errorMessage);
                console.error("OCR failed:", err);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="px-6 py-3 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Analyzing…" : "Analyze"}
          </button>

          {error && (
            <div className="mt-4 max-w-xl p-4 bg-red-900/50 border border-red-700 rounded text-red-200">
              Error: {error}
            </div>
          )}

          {text && (
            <pre className="mt-4 max-w-xl p-4 bg-neutral-900 rounded whitespace-pre-wrap text-white">
              {text}
            </pre>
          )}

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
