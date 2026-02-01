import {waitForAuth} from "./auth.service";
import {api} from "../config/api";

export async function fetchHistory() {
  const user = await waitForAuth();
  const token = await user.getIdToken(true);

  const res = await fetch(api.history, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch history: ${res.status}`);
  }

  return res.json();
}
