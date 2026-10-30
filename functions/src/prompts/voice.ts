import {SchemaType, type ResponseSchema} from "@google/generative-ai";

/* ------------------------------------------------------------------ */
/* Ustad — recitation / talaffuz coach                                  */
/* ------------------------------------------------------------------ */

export const USTAD_PERSONA = `
You are "Ustad", an AI Urdu recitation coach inside the Sher Samjho app.
You are an AI, not any real poet or person — never imitate or claim to be
Ghalib, Faiz, Mir or any real poet. You are warm, encouraging and precise,
like a good ustad at a mehfil. You speak in simple Hinglish (Roman script),
with Urdu terms where natural.`;

/**
 * Builds the pronunciation-evaluation prompt.
 * @param {object} ref - Reference sher in available scripts
 * @return {string} Prompt text (audio is attached separately)
 */
export function recitePrompt(ref: {
  devanagari: string;
  urdu?: string;
  roman?: string;
  poet?: string;
}): string {
  return `${USTAD_PERSONA}

The learner has recorded themselves reciting this sher (audio attached).

REFERENCE SHER
Devanagari:
${ref.devanagari}
${ref.urdu ? `Urdu (Nastaliq):\n${ref.urdu}\n` : ""}${
  ref.roman ? `Roman:\n${ref.roman}\n` : ""}${
  ref.poet ? `Poet: ${ref.poet}\n` : ""}
TASK
1. Listen carefully and write what you actually heard (Devanagari) as
   "transcript".
2. Align the recitation to the reference, word by word, IN ORDER. For every
   reference word output one entry with status:
   - "correct": said acceptably (do not penalise a normal Indian accent)
   - "mispronounced": a real talaffuz error
   - "missed": skipped
   Add an entry with status "extra" only for clearly inserted words.
3. Focus on the classic Urdu talaffuz errors and name them in "issue":
   qaaf→kaaf (ق/क़ said as क), ḳhe→khe (ख़ said as ख), ghain→gaaf (ग़→ग),
   ze/zaal/zuad/zoe→ja (ज़ said as ज), fe→phe (फ़ said as फ),
   ain (ع) swallowed or wrong, noon-ghunna (ں) pronounced fully,
   izafat (-e-) dropped, wrong stress/length (lambi vs chhoti awaaz),
   words merged or cut. Use "" when correct.
4. "tip": one short Hinglish instruction for HOW to say it right
   (e.g. "q gale ke andar se, kaaf se peeche"). "" when correct.
5. "meaning": 2–5 word English meaning of the reference word.
6. Scores 0–100: pronunciationScore, fluencyScore (pace, pauses, no
   stumbling), completenessScore (how much of the sher was recited) and
   overallScore (weighted: 50% pronunciation, 25% fluency, 25% completeness).
7. "ustadSays": 2–3 spoken-style sentences in Hinglish. Start with one honest
   bit of praise, then correct the single most important mistake the way an
   ustad would ("Aapne 'kalb' kaha — sahi hai 'qalb', q gale se…"), then
   one encouragement. This text is read aloud, so no emojis or markdown.
8. "deliveryTips": up to 3 short mushaira-delivery tips (where to pause,
   repeating the first misra for effect, pace, emphasis on the radif).
9. "audioQuality": "good", "noisy", "silent" (nothing audible) or
   "unrelated" (they recited something else). For silent/unrelated give
   overallScore 0, mark words "missed", and explain kindly in ustadSays.

Be honest: do not invent mistakes in a good recitation, and do not ignore
clear ones.`;
}

const wordSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    ref: {type: SchemaType.STRING, description: "Reference word (Devanagari)"},
    roman: {type: SchemaType.STRING},
    heard: {type: SchemaType.STRING},
    status: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["correct", "mispronounced", "missed", "extra"],
    },
    issue: {type: SchemaType.STRING},
    tip: {type: SchemaType.STRING},
    meaning: {type: SchemaType.STRING},
  },
  required: ["ref", "roman", "heard", "status", "issue", "tip", "meaning"],
} as ResponseSchema;

export const reciteSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    transcript: {type: SchemaType.STRING},
    audioQuality: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["good", "noisy", "silent", "unrelated"],
    },
    overallScore: {type: SchemaType.INTEGER},
    pronunciationScore: {type: SchemaType.INTEGER},
    fluencyScore: {type: SchemaType.INTEGER},
    completenessScore: {type: SchemaType.INTEGER},
    words: {type: SchemaType.ARRAY, items: wordSchema},
    ustadSays: {type: SchemaType.STRING},
    deliveryTips: {type: SchemaType.ARRAY, items: {type: SchemaType.STRING}},
  },
  required: [
    "transcript", "audioQuality", "overallScore", "pronunciationScore",
    "fluencyScore", "completenessScore", "words", "ustadSays", "deliveryTips",
  ],
} as ResponseSchema;

/* ------------------------------------------------------------------ */
/* Transcription (voice questions)                                     */
/* ------------------------------------------------------------------ */

export const TRANSCRIBE_PROMPT = `
Transcribe this short voice message exactly. The speaker may use Hindi,
Urdu, English or a mix. Write it the way the speaker would type it in chat:
English words in English, Hindi/Urdu words in Roman (Hinglish). Do not
answer or translate. If nothing is audible, return an empty "text".`;

export const transcribeSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    text: {type: SchemaType.STRING},
    language: {type: SchemaType.STRING},
  },
  required: ["text", "language"],
} as ResponseSchema;

/* ------------------------------------------------------------------ */
/* "Ek sher tha…" — find a half-remembered sher                        */
/* ------------------------------------------------------------------ */

export const FIND_SHER_PROMPT = `
A user is trying to find an Urdu/Hindi sher (couplet) they half remember.
They spoke (audio) or typed a fragment — maybe only a few words, maybe with
wrong words, in Hindi, Urdu or Roman.

1. "heard": the fragment exactly as given (Devanagari).
2. If you are genuinely confident this fragment belongs to a real, well-known
   sher, fill "identified" with the COMPLETE sher (both misre) in Devanagari
   and Roman, the poet, and a one-line simple meaning in English.
   Set "confidence" 0–1 honestly. If you are not sure, set found=false and
   leave the text fields "" — never invent a sher or guess a poet.
3. "searchQuery": a short meaning-based English query (themes/imagery) that
   could find similar shers in a database.`;

export const findSherSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    heard: {type: SchemaType.STRING},
    identified: {
      type: SchemaType.OBJECT,
      properties: {
        found: {type: SchemaType.BOOLEAN},
        devanagari: {type: SchemaType.STRING},
        roman: {type: SchemaType.STRING},
        poet: {type: SchemaType.STRING},
        meaning: {type: SchemaType.STRING},
        confidence: {type: SchemaType.NUMBER},
      },
      required: [
        "found", "devanagari", "roman", "poet", "meaning", "confidence",
      ],
    },
    searchQuery: {type: SchemaType.STRING},
  },
  required: ["heard", "identified", "searchQuery"],
} as ResponseSchema;

/* ------------------------------------------------------------------ */
/* Bait-bazi — the traditional couplet duel                            */
/* ------------------------------------------------------------------ */

/**
 * Builds the bait-bazi judging + reply prompt.
 * @param {string | null} requiredLetter - Letter the user had to start with
 * @param {string[]} used - Shers already used in this game
 * @return {string} Prompt
 */
export function baitBaziPrompt(
  requiredLetter: string | null,
  used: string[],
): string {
  return `You are the AI opponent and judge in a game of bait-bazi, the
traditional Urdu couplet duel. Rule: each sher must START with the letter
that the previous sher ENDED with, judged by URDU spelling (Perso-Arabic
letters, e.g. م meem, ن noon, ی ye, ہ he, ا alif). You are an AI — never claim
to be a real poet.

The player just recited/typed a sher (audio or text attached).
${requiredLetter ?
    `They had to start with the letter: ${requiredLetter}` :
    "This is the opening sher, so any starting letter is allowed."}

Already used in this game (do not reuse):
${used.length ? used.map((u) => `- ${u}`).join("\n") : "- (none)"}

Do this:
1. "heard": the player's sher in Devanagari.
2. "isRecognizedSher": true only if it is a real, known sher (or clearly a
   proper couplet); "poet" if you are confident, otherwise "Unknown".
3. "firstLetter" and "lastLetter" of the player's sher in Urdu spelling,
   formatted like "म / م (meem)".
4. "followsRule": does it start with the required letter? (true if none was
   required).
5. "points" 0–10: 0 if rule broken or not a sher; else up to 10 for a real
   sher + correct rule + good recitation.
6. "verdict": one lively sentence of judge commentary in Hinglish.
7. "aiSher": YOUR reply — a REAL, well-known sher (no inventing) that starts
   with the player's lastLetter and is not already used. Give it in Urdu
   (Perso-Arabic) script, Devanagari and Roman, with the poet and a one-line
   English meaning.
8. "nextLetter": the last letter of YOUR sher, formatted like "म / م (meem)" —
   the player must start with this next.`;
}

const sherObj: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    urdu: {type: SchemaType.STRING},
    devanagari: {type: SchemaType.STRING},
    roman: {type: SchemaType.STRING},
    poet: {type: SchemaType.STRING},
    meaning: {type: SchemaType.STRING},
  },
  required: ["urdu", "devanagari", "roman", "poet", "meaning"],
} as ResponseSchema;

export const baitBaziSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    heard: {type: SchemaType.STRING},
    isRecognizedSher: {type: SchemaType.BOOLEAN},
    poet: {type: SchemaType.STRING},
    firstLetter: {type: SchemaType.STRING},
    lastLetter: {type: SchemaType.STRING},
    followsRule: {type: SchemaType.BOOLEAN},
    points: {type: SchemaType.INTEGER},
    verdict: {type: SchemaType.STRING},
    aiSher: sherObj,
    nextLetter: {type: SchemaType.STRING},
  },
  required: [
    "heard", "isRecognizedSher", "poet", "firstLetter", "lastLetter",
    "followsRule", "points", "verdict", "aiSher", "nextLetter",
  ],
} as ResponseSchema;
