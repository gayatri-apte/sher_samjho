import {api} from "../../config/api";
import {auth} from "../../services/firebase";

export type TashreehLevels = {
  beginner: string;
  intermediate: string;
  scholar: string;
};

export async function fetchTashreeh(text: string): Promise<TashreehLevels> {
  const token = await auth.currentUser?.getIdToken(true);

  const res = await fetch(api.tashreeh, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? {Authorization: `Bearer ${token}`} : {}),
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage =
      errorData.error ||
      errorData.message ||
      `HTTP ${res.status}: ${res.statusText}`;
    throw new Error(`Explanation failed: ${errorMessage}`);
  }

  const data = await res.json();
  if (!data.beginner && !data.intermediate && !data.scholar) {
    throw new Error("No explanation received from server");
  }
  return data as TashreehLevels;
}