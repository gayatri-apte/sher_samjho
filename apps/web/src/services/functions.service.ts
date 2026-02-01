import {api} from "../config/api";
import {waitForAuth} from "./auth.service";

export async function callHistory() {
  const user = await waitForAuth();
  const token = await user.getIdToken(true);

  const res = await fetch(
    api.history,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const errorJson = await res
      .json()
      .catch(() => null) as Record<string, unknown> | null;
    const errorText = errorJson ? null : await res.text().catch(() => "");
    const message =
      (errorJson?.detail as string) ||
      (errorJson?.error as string) ||
      (errorJson?.message as string) ||
      (errorText ? errorText.slice(0, 200) : null) ||
      `HTTP ${res.status}`;
    throw new Error(message);
  }

  return res.json();
}

export async function saveHistory(cacheHash: string) {
  const user = await waitForAuth();
  const token = await user.getIdToken(true);

  const res = await fetch(api.save, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ cacheHash }),
  });

  if (!res.ok) {
    const errorJson = await res
      .json()
      .catch(() => null) as Record<string, unknown> | null;
    const errorText = errorJson ? null : await res.text().catch(() => "");
    const message =
      (errorJson?.detail as string) ||
      (errorJson?.error as string) ||
      (errorJson?.message as string) ||
      (errorText ? errorText.slice(0, 200) : null) ||
      `Save failed: ${res.status}`;
    throw new Error(message);
  }

  return res.json();
}
