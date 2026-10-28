import {useEffect, useState} from "react";
import {doc, getDoc, setDoc, deleteDoc} from "firebase/firestore";
import {auth, db} from "../services/firebase";

type Props = {
  poetId: string;
};

export default function FollowPoet({poetId}: Props) {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user || !poetId) {
        setFollowing(false);
        setLoading(false);
        return;
      }

      try {
        const ref = doc(db, "users", user.uid, "following", poetId);
        const snap = await getDoc(ref);
        setFollowing(snap.exists());
      } catch (err) {
        console.error("Failed to check following status", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [poetId]);

  async function toggleFollow() {
    const user = auth.currentUser;
    if (!user || !poetId) {
      // Optionally you could redirect to login here.
      return;
    }

    const ref = doc(db, "users", user.uid, "following", poetId);

    try {
      if (following) {
        await deleteDoc(ref);
        setFollowing(false);
      } else {
        await setDoc(ref, {followedAt: new Date()});
        setFollowing(true);
      }
    } catch (err) {
      console.error("Failed to toggle follow", err);
    }
  }

  if (!poetId) return null;

  return (
    <button
      onClick={toggleFollow}
      disabled={loading}
      className="px-4 py-1.5 rounded-full border border-[#e2c9ad] bg-white text-sm text-[#5a321c] hover:bg-[#f6e2cf] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {following ? "Unfollow" : "Follow"}
    </button>
  );
}

