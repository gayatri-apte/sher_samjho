/**
 * Updates streak based on lastActiveDate. Returns new streak count.
 * @param {FirebaseFirestore.DocumentData} userDoc - User doc with
 *   lastActiveDate, streak
 * @return {number} New streak count
 */
export function updateStreak(
  userDoc: FirebaseFirestore.DocumentData
): number {
  const today = new Date().toISOString().slice(0, 10);

  if (userDoc.lastActiveDate === today) {
    return userDoc.streak || 1;
  }

  const yesterday = new Date(Date.now() - 86400000)
    .toISOString()
    .slice(0, 10);

  if (userDoc.lastActiveDate === yesterday) {
    return (userDoc.streak || 0) + 1;
  }

  return 1;
}
