import {getFirestore, FieldValue} from "firebase-admin/firestore";

/**
 * Increment a user stats field and update streak metadata.
 * Fields include: totalScans, totalReviews, masteryScore, etc.
 *
 * Streak logic:
 * - currentStreak increments when lastActiveDate !== today (date string)
 * - longestStreak tracks the max currentStreak
 *
 * @param {string} uid - User ID
 * @param {string} field - Counter field to increment on the user doc
 * @return {Promise<void>}
 */
export async function updateUserStats(
  uid: string,
  field: string
): Promise<void> {
  const db = getFirestore();
  const userRef = db.collection("users").doc(uid);
  const snap = await userRef.get();
  const data = snap.data() || {};

  const today = new Date().toDateString();
  const lastActive = data.lastActiveDate as string | undefined;

  let currentStreak = (data.currentStreak as number | undefined) || 0;
  let longestStreak = (data.longestStreak as number | undefined) || 0;

  if (lastActive !== today) {
    currentStreak += 1;
    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }
  }

  await userRef.set(
    {
      [field]: FieldValue.increment(1),
      currentStreak,
      longestStreak,
      lastActiveDate: today,
    },
    {merge: true}
  );
}

