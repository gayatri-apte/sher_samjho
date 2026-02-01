import {getFirestore} from "firebase-admin/firestore";

/**
 * Saves a scan record under the authenticated user.
 *
 * @param {string} uid Firebase Auth uid
 * @param {string} cacheHash Deterministic hash for cached result
 * @param {string} imageHash Hash of the image
 *   (may be empty for non-image saves)
 * @param {"camera" | "upload"} source Capture source
 */
export async function saveScan(
  uid: string,
  cacheHash: string,
  imageHash: string,
  source: "camera" | "upload"
) {
  const db = getFirestore();
  await db
    .collection("users")
    .doc(uid)
    .collection("scans")
    .add({
      cacheHash,
      imageHash,
      source,
      createdAt: new Date(),
    });
}
