import { api } from "../../config/api";
import { waitForAuth } from "../../services/auth.service";

export type DictionaryResult = { meaning: string };

export function useDictionary() {
  async function lookup(word: string): Promise<DictionaryResult> {
    const user = await waitForAuth();
    const token = await user.getIdToken(true);

    const res = await fetch(api.dictionary, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ word }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(err?.error ?? "Dictionary lookup failed");
    }
    return res.json();
  }

  return { lookup };
}
