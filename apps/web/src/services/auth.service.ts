import {onAuthStateChanged, signOut} from "firebase/auth";
import type {User} from "firebase/auth";
import {auth} from "./firebase";

export function logout() {
  return signOut(auth);
}

/** Waits for auth state to be ready. Resolves with user or rejects if not logged in. */
export function waitForAuth(): Promise<User> {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (user) resolve(user);
      else reject(new Error("Not logged in"));
    });
  });
}
