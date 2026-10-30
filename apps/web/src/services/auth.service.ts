import { signInAnonymously, signOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "./firebase";

export function logout() {
  return signOut(auth);
}

export function guestLogin() {
  return signInAnonymously(auth);
}

/**
 * Resolves with the signed-in user once Firebase has restored the session.
 * (The old version could hang forever, leaving pages stuck on "Loading…".)
 */
export async function waitForAuth(): Promise<User> {
  await Promise.race([
    auth.authStateReady(),
    new Promise((r) => setTimeout(r, 8000)),
  ]);
  if (!auth.currentUser) throw new Error("Please sign in to see this.");
  return auth.currentUser;
}
