import {generateText} from "../services/gemini.service";
import {
  devanagariToRomanPrompt,
  urduToDevanagariPrompt,
  urduToRomanPrompt,
} from "../prompts/transliteration";

/**
 * Transliterates Urdu (Perso-Arabic) text to Devanagari (Hindi) using Gemini.
 * @param {string} urdu - Raw Urdu text
 * @return {Promise<string>} Devanagari text
 */
export async function transliterateToDevanagari(urdu: string): Promise<string> {
  const trimmed = urdu.trim();
  if (!trimmed) return "";
  const prompt = urduToDevanagariPrompt(trimmed);
  return generateText(prompt);
}

/**
 * Transliterates Urdu to Roman Urdu (Latin script) using Gemini.
 * @param {string} urdu - Raw Urdu text
 * @return {Promise<string>} Roman Urdu text
 */
export async function transliterateToRoman(urdu: string): Promise<string> {
  const trimmed = urdu.trim();
  if (!trimmed) return "";
  const prompt = urduToRomanPrompt(trimmed);
  return generateText(prompt);
}

/**
 * Transliterates Devanagari (Hindi) to Roman/Latin using Gemini.
 * @param {string} devanagari - Hindi text in Devanagari script
 * @return {Promise<string>} Roman text
 */
export async function transliterateDevanagariToRoman(
  devanagari: string
): Promise<string> {
  const trimmed = devanagari.trim();
  if (!trimmed) return "";
  const prompt = devanagariToRomanPrompt(trimmed);
  return generateText(prompt);
}
