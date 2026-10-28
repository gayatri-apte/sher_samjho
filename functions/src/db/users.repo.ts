import {FieldValue, getFirestore} from "firebase-admin/firestore";
import type {DecodedIdToken} from "firebase-admin/auth";

// Avoid a Firestore write on every authenticated request.
const seen = new Map<string, number>();
const TOUCH_EVERY_MS = 10 * 60 * 1000;

/**
 * Ensures a user doc exists without overwriting createdAt.
 * Only touches lastLoginAt at most every 10 minutes per instance.
 * @param {DecodedIdToken} user Decoded Firebase token
 */
export async function ensureUser(user: DecodedIdToken) {
  const last = seen.get(user.uid) || 0;
  if (Date.now() - last < TOUCH_EVERY_MS) return;
  seen.set(user.uid, Date.now());

  const ref = getFirestore().collection("users").doc(user.uid);
  const displayName =
    (user.name as string | undefined) ||
    (user.email ? user.email.split("@")[0] : "Guest");

  try {
    await ref.create({
      email: user.email ?? null,
      displayName,
      createdAt: FieldValue.serverTimestamp(),
      lastLoginAt: FieldValue.serverTimestamp(),
    });
  } catch {
    // Already exists: just refresh login time (and name if missing)
    await ref.set(
      {lastLoginAt: FieldValue.serverTimestamp()},
      {merge: true},
    );
  }
}
