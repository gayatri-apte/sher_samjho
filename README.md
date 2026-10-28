# Sher Samjho · شعر سمجھو

**Understand, hear and recite Urdu poetry with an AI ustad that listens.**

Millions of Hindi/Urdu speakers love shayari but can't read Nastaliq and aren't
confident pronouncing it (*qalb* vs *kalb*, *ḳhvāb* vs *khvāb*). Sher Samjho
lets you **scan** a printed sher, **hear** it read aloud, **understand** it at
three depths, and **practise reciting** it with **Ustad**, an AI coach that
catches your talaffuz mistakes word by word and turns them into a
spaced-repetition deck.

---

## Features

### Speak & listen (voice-first)
| | What it does |
|---|---|
| 🎙 **Ustad**: AI recitation coach | Recite a sher aloud. Gemini listens, aligns your audio with the reference word by word, flags real talaffuz errors (qaaf→kaaf, ḳhe→khe, ghain→gaaf, dropped izafat, noon-ghunna, swallowed ain, missed words) and gives a 0–100 score for pronunciation, fluency and completeness. Ustad then **speaks** the correction back to you. Tap any word to hear it slowly. Every mistake goes **straight into your SM-2 deck**. |
| 🔎 **Ek sher tha…**: voice search | Say half a line you remember, in broken Hindi or Urdu. You get the full sher, the poet and the meaning, plus the closest matches in the app's own collection (embedding search). |
| ⚔️ **Bait-bazi**: couplet duel | The traditional game. Your sher ends on a letter, and the AI must answer with a *real* sher that starts with it, then recites it aloud. The AI also judges your letter rule and keeps score. |
| 🗣 **Talk to the tashreeh** | Ask follow-up questions about a sher by voice. Answers keep the conversation context and can be read aloud. |
| 🔊 **Point-and-speak** | Every scanned or opened sher can be read aloud in an Urdu or Hindi voice, at normal speed or in slow learner mode. |

### Read & understand
- **Tasveer (scan)**: Google Vision OCR for Urdu and Hindi, transliteration into Devanagari and Roman, and tashreeh at three levels (beginner, intermediate, scholar). Results are cached globally by text hash.
- **Tap-a-word dictionary**: tap a word to see its meaning and add it to your deck.
- **Practice deck**: real **SM-2** (easiness, interval, due date) with Again/Hard/Good/Easy grading.
- **Aaj ka sher**: one sher a day, the same for everyone.
- **Search**: keyword plus semantic (meaning) search, mood, era and poet discovery, and similar shers.
- **Community**: comments, following poets, a streak leaderboard, and a progress dashboard.

---

## Architecture

```
apps/web (React 19 + Vite + Tailwind v4)
  ├─ lib/audio/useVoiceRecorder  mic → MediaRecorder → 16 kHz mono WAV (Web Audio)
  ├─ lib/audio/speak             TTS playback with cache
  └─ pages/ustad, find, baitbazi, scan, …
            │  HTTPS + Firebase ID token
            ▼
functions (Firebase Functions v2, Express, TypeScript)  /api/*
  ├─ guards: requireAuth · optionalAuth · requireAdmin · rateLimit
  ├─ /voice/recite      Gemini 2.5 Flash (audio in) + JSON schema → per-word verdicts
  │                     → users/{uid}/vocabulary (SM-2) + recitationAttempts
  ├─ /voice/find-sher   Gemini (audio/text) → identification + embedding search
  ├─ /voice/baitbazi    Gemini judge + reply
  ├─ /voice/transcribe  Gemini speech-to-text
  ├─ /ocr               Vision OCR → Gemini transliteration + 3-level tashreeh → cache
  ├─ /tts               Cloud Text-to-Speech (ur-IN / hi-IN, slow mode, LRU cache)
  └─ /search, /similar, /feed/daily, /sher/:id   (in-memory corpus + cosine similarity)
            ▼
Firestore: global_poetry_cache (server-write only) · users/{uid}/{scans,vocabulary,…}
```

Structured output (`responseSchema`) means the AI always returns parseable JSON,
so the demo can't break on malformed model text.

---

## Run it locally

```bash
# 1. Backend secrets (never commit these)
cp functions/.env.example functions/.env      # add GEMINI_API_KEY, ADMIN_EMAILS
cp apps/web/.env.example  apps/web/.env       # add your Firebase web config

# 2. Install
npm --prefix functions install
npm --prefix apps/web install

# 3. Run
npm --prefix functions run serve              # Functions emulator
npm --prefix apps/web run dev                 # http://localhost:5173
# point VITE_API_BASE at the emulator URL it prints, e.g.
# http://127.0.0.1:5001/<project-id>/us-central1
```

Enable these in Google Cloud for the project: **Vision API**, **Text-to-Speech API**,
and Firebase **Auth** (Email, Google, Anonymous, Phone).

## Deploy

```bash
firebase deploy --only functions,firestore:rules,storage,hosting
```
Hosting builds `apps/web` automatically and serves `apps/web/dist`. `/api/**` is
rewritten to the function, so you can set `VITE_API_BASE` to your hosting URL.

---

## 3-minute demo script

1. **Hook (20 s).** "Raise your hand if you love shayari but can't read this." Show Nastaliq.
2. **Scan (40 s).** Photograph a printed Ghalib sher. It's transliterated and explained, then tap **Read it aloud**.
3. **Ustad (80 s).** Tap **Practice reciting**. Recite it *badly on purpose* (say *kalb*, drop the izafat).
   Ustad scores you, says the correction aloud, and highlights the exact words.
   Tap a red word to hear it slowly. Recite again and show the score jump. Then show the words that landed in the deck.
4. **Bait-bazi (30 s).** Challenge a judge. The AI answers with a real sher on the right letter and recites it.
5. **Close (10 s).** Numbers from real users, and the "why now" slide.

Keep a backup screen recording in case the venue Wi-Fi fails.

---

## Security notes
- Secrets live only in `functions/.env` (gitignored). The Firebase web config is public by design.
- Firestore rules: the poetry corpus, user stats and vocabulary are **server-write only**. Comments can only be edited or deleted by their author.
- Paid AI endpoints are rate-limited per user/IP. `/admin-analytics` requires an admin (custom claim or `ADMIN_EMAILS`).
- AI output is always labelled as AI. Ustad is an original AI character and never imitates a real poet's voice.
