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
  dictionary: `${API_BASE}/api/dictionary`,
  vocabulary: `${API_BASE}/api/vocabulary`,
  wordSave: `${API_BASE}/api/word/save`,
  wordReview: `${API_BASE}/api/word/review`,
  search: `${API_BASE}/api/search`,
  keywordSearch: `${API_BASE}/api/search/keyword`,
  moodSearch: `${API_BASE}/api/search/mood`,
} as const;
