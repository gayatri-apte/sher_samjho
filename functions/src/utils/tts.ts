import {TextToSpeechClient} from "@google-cloud/text-to-speech";

const client = new TextToSpeechClient();

/**
 * Generates MP3 audio for the given Urdu text using Cloud TTS.
 * @param {string} text - The text to synthesize.
 * @return {Promise<Uint8Array | string | null | undefined>} Raw audio bytes.
 */
export async function generateSpeech(text: string) {
  const request = {
    input: {text},
    voice: {
      languageCode: "ur-PK",
      ssmlGender: "NEUTRAL" as const,
    },
    audioConfig: {
      audioEncoding: "MP3" as const,
      speakingRate: 0.9,
    },
  };

  const [response] = await client.synthesizeSpeech(request);

  return response.audioContent;
}
