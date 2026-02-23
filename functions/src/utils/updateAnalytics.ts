import {getFirestore, FieldValue} from "firebase-admin/firestore";

const COLLECTION = "analytics";
const DOC_ID = "stats";

/**
 * Increments a global analytics counter field.
 * Collection: analytics/global, document: stats.
 *
 * @param {string} field - Counter field to increment
 * @return {Promise<void>}
 */
export async function incrementStat(field: string): Promise<void> {
  const db = getFirestore();
  await db
    .collection(COLLECTION)
    .doc(DOC_ID)
    .set(
      {
        [field]: FieldValue.increment(1),
      },
      {merge: true}
    );
}

