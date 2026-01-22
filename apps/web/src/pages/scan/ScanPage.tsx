import { useState } from "react";
import CameraCapture from "../../components/camera/CameraCapture";
import ImageUpload from "../../components/camera/ImageUpload";
import { useOCR } from "../../features/ocr/useOCR";
import { useTashreeh } from "../../features/tashreeh/useTashreeh";


export default function ScanPage() {
  const [image, setImage] = useState<File | null>(null);
  const { text, loading, error, analyze } = useOCR();
  const { explanation, loading: explainLoading, error: explainError, explain } = useTashreeh();

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
            onClick={() => analyze(image)}
            disabled={loading}
            className="px-6 py-3 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>

          {error && (
            <div className="mt-4 max-w-xl p-4 bg-red-900/50 border border-red-700 rounded text-red-200">
              Error: {error}
            </div>
          )}

          {text && (
            <>
              <div className="mt-6 p-4 rounded bg-neutral-900 text-right leading-loose">
                {text}
              </div>
              <button
                onClick={() => explain(text)}
                disabled={explainLoading}
                className="px-6 py-3 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {explainLoading ? "Explaining..." : "Explain"}
              </button>
              {explainError && (
                <div className="mt-4 max-w-xl p-4 bg-red-900/50 border border-red-700 rounded text-red-200">
                  Error: {explainError}
                </div>
              )}
            </>
          )}

          {explanation && (
            <div className="mt-6 p-4 rounded bg-neutral-900 text-right leading-loose">
              {explanation}
            </div>
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
