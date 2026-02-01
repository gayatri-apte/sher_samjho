import {FieldValue, getFirestore} from "firebase-admin/firestore";

/**
 * Ensures a user doc exists; creates or merges atomically.
 * Uses set(..., { merge: true }) so the doc is always created if missing.
 *
 * @param {string} uid Firebase Auth uid
 * @param {string | null} email User email (if available)
 */
export async function ensureUser(uid: string, email: string | null) {
  const db = getFirestore();
  const ref = db.collection("users").doc(uid);

  await ref.set(
    {
      email,
      createdAt: FieldValue.serverTimestamp(),
      lastLoginAt: FieldValue.serverTimestamp(),
    },
    {merge: true}
  );
}
