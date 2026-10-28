import {getFirestore, FieldValue} from "firebase-admin/firestore";

/**
 * Today's date (YYYY-MM-DD) in India time, so streaks roll over at
 * local midnight rather than 05:30 IST.
 * @param {number} offsetDays - Days to add (e.g. -1 for yesterday)
 * @return {string} Date string
 */
export function istDate(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return d.toLocaleDateString("en-CA", {timeZone: "Asia/Kolkata"});
}

/**
 * Increment a user stats counter and update the daily streak.
 * Streak rules: same day → unchanged; yesterday → +1; any gap → reset to 1.
 *
 * @param {string} uid - User ID
 * @param {string} field - Counter to increment (totalScans, totalReviews...)
 * @param {Record<string, unknown>} extra - Extra fields to merge
 * @return {Promise<void>}
 */
export async function updateUserStats(
  uid: string,
  field: string,
  extra: Record<string, unknown> = {},
): Promise<void> {
  const db = getFirestore();
  const userRef = db.collection("users").doc(uid);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    const data = snap.data() || {};
    const today = istDate();
    const yesterday = istDate(-1);
    const last = data.lastActiveDate as string | undefined;

    let currentStreak = Number(data.currentStreak) || 0;
    if (last === today) {
      currentStreak = Math.max(currentStreak, 1);
    } else if (last === yesterday) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }
    const longestStreak = Math.max(
      Number(data.longestStreak) || 0,
      currentStreak,
    );

    tx.set(
      userRef,
      {
        [field]: FieldValue.increment(1),
        currentStreak,
        longestStreak,
        // keep legacy `streak` field in sync for older UI code
        streak: currentStreak,
        lastActiveDate: today,
        ...extra,
      },
      {merge: true},
    );
  });
}
