// Firebase Functions base URL (set VITE_API_BASE in apps/web/.env)
const DEFAULT_API_BASE =
  "https://us-central1-internship-8cf33.cloudfunctions.net";

const raw =
  import.meta.env?.VITE_API_BASE ||
  import.meta.env?.VITE_API_BASE_URL;
export const API_BASE =
  (typeof raw === "string" && raw.trim()) ? raw.trim().replace(/\/$/, "") : DEFAULT_API_BASE;

const b = `${API_BASE}/api`;

export const api = {
  ocr: `${b}/ocr`,
  tashreeh: `${b}/tashreeh`,
  history: `${b}/history`,
  save: `${b}/save`,
  dictionary: `${b}/dictionary`,
  vocabulary: `${b}/vocabulary`,
  wordSave: `${b}/word/save`,
  wordReview: `${b}/word/review`,
  search: `${b}/search`,
  keywordSearch: `${b}/search/keyword`,
  moodSearch: `${b}/search/mood`,
  eraSearch: `${b}/search/era`,
  similar: `${b}/similar`,
  sher: (id: string) => `${b}/sher/${encodeURIComponent(id)}`,
  dailySher: `${b}/feed/daily`,
  poetryChat: `${b}/poetry-chat`,
  poetryComplete: `${b}/poetry-complete`,
  tts: `${b}/tts`,
  recite: `${b}/voice/recite`,
  transcribe: `${b}/voice/transcribe`,
  findSher: `${b}/voice/find-sher`,
  baitBazi: `${b}/voice/baitbazi`,
  uploadRecitation: `${b}/upload-recitation`,
  officialRecitations: (sherId: string) =>
    `${b}/official-recitations/${encodeURIComponent(sherId)}`,
  leaderboard: `${b}/leaderboard`,
  adminAnalytics: `${b}/admin-analytics`,
} as const;
