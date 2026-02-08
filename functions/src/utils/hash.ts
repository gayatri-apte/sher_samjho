import {createHash as cryptoCreateHash} from "crypto";

/**
 * Creates a stable hash of the given text for cache keys.
 * @param {string} text - Raw text (e.g. Urdu)
 * @return {string} Hex-encoded SHA-256 hash
 */
export function createHash(text: string): string {
  return cryptoCreateHash("sha256").update(text, "utf8").digest("hex");
}
