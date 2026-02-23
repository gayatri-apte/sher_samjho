// Firebase Functions base URL (override via VITE_API_BASE or VITE_API_BASE_URL)
const DEFAULT_API_BASE =
  "https://us-central1-internship-8cf33.cloudfunctions.net";

const raw =
  import.meta.env?.VITE_API_BASE ||
  import.meta.env?.VITE_API_BASE_URL;
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
  poetryChat: `${API_BASE}/api/poetry-chat`,
  poetryComplete: `${API_BASE}/api/poetry-complete`,
  tts: `${API_BASE}/api/tts`,
  uploadRecitation: `${API_BASE}/api/upload-recitation`,
  officialRecitations: (sherId: string) =>
    `${API_BASE}/api/official-recitations/${encodeURIComponent(sherId)}`,
  leaderboard: `${API_BASE}/api/leaderboard`,
  adminAnalytics: `${API_BASE}/api/admin-analytics`,
} as const;
