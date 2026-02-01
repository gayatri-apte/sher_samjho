// Firebase Functions base URL (can be overridden via VITE_API_BASE_URL)
const DEFAULT_API_BASE =
  "https://us-central1-internship-8cf33.cloudfunctions.net";

const raw = import.meta.env?.VITE_API_BASE_URL;
export const API_BASE =
  (typeof raw === "string" && raw.trim()) ? raw.trim() : DEFAULT_API_BASE;

export const api = {
  ocr: `${API_BASE}/api/ocr`,
  tashreeh: `${API_BASE}/api/tashreeh`,
  history: `${API_BASE}/api/history`,
  save: `${API_BASE}/api/save`,
} as const;
