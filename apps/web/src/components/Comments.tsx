import {useEffect, useState} from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import {db, auth} from "../services/firebase";
import {useAuth} from "../hooks/useAuth";

type Comment = {
  id: string;
  text: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  createdAt?: {seconds: number; nanoseconds: number} | Date | null;
};

type Props = {
  sherId?: string | null;
};

export default function Comments({sherId}: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const {isAuthenticated} = useAuth();

  useEffect(() => {
    if (!sherId) return;

    async function fetchComments() {
      if (!sherId) return;
      try {
        setLoading(true);
        const q = query(
          collection(db, "global_poetry_cache", sherId, "comments"),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        setComments(
          snap.docs.map((doc) => {
            const data = doc.data() as Comment;
            return {
              id: doc.id,
              text: data.text,
              userId: data.userId,
              userName: data.userName || undefined,
              createdAt: data.createdAt,
            };
          })
        );
      } catch (err) {
        console.error("Failed to fetch comments", err);
      } finally {
        setLoading(false);
      }
    }

    void fetchComments();
  }, [sherId]);

  async function deleteComment(commentId: string) {
    if (!sherId) return;
    if (!isAuthenticated) return;
    const currentUser = auth.currentUser;
    const comment = comments.find((c) => c.id === commentId);
    if (!comment || comment.userId !== currentUser?.uid) return;
    try {
      await deleteDoc(
        doc(db, "global_poetry_cache", sherId, "comments", commentId)
      );
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to delete comment");
      setTimeout(() => setError(null), 3000);
    }
  }

  async function addComment() {
    try {
      if (!text.trim()) return;

      if (!sherId) {
        setError("No sher ID available");
        return;
      }

      if (!isAuthenticated) {
        setError("Please sign in to post a comment");
        setTimeout(() => setError(null), 3000);
        return;
      }

      setSubmitting(true);
      setError(null);
      setSuccess(false);

      const currentUser = auth.currentUser;

      await addDoc(
        collection(db, "global_poetry_cache", sherId, "comments"),
        {
          text: text.trim(),
          userId: currentUser?.uid,
          userName:
            currentUser?.displayName ||
            (currentUser?.isAnonymous ? "Guest" : currentUser?.email?.split("@")[0]) ||
            "Reader",
          createdAt: serverTimestamp(),
        }
      );

      setText("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      
      // Refetch comments to get the actual document ID and updated list
      const q = query(
        collection(db, "global_poetry_cache", sherId, "comments"),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setComments(
        snap.docs.map((doc) => {
          const data = doc.data() as Comment;
          return {
            id: doc.id,
            text: data.text,
            userId: data.userId,
            userName: data.userName || undefined,
            createdAt: data.createdAt,
          };
        })
      );
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to post comment. Please try again.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setSubmitting(false);
    }
  }

  if (!sherId) {
    return null;
  }

  return (
    <div className="mt-10">
      <h2 className="text-xl mb-4">Comments</h2>

      {!isAuthenticated && (
        <p className="mb-4 text-sm text-[#94725a]">
          Sign in to post a comment
        </p>
      )}

      <textarea
        className="w-full bg-[#f6e2cf] border border-[#e2c9ad] text-[#3b2419] placeholder:text-[#c39a79] p-3 rounded-lg resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-[#c26a3b]/40"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your thoughts…"
        maxLength={1000}
        disabled={!isAuthenticated}
      />

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={addComment}
          disabled={submitting || !text.trim() || !isAuthenticated}
          className="px-5 py-2 rounded-full bg-[#c26a3b] text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#a9552a] transition-colors"
        >
          {submitting ? "Posting…" : success ? "✓ Posted!" : "Post"}
        </button>
        {error && (
          <p className="text-sm text-[#8a2a1a]">{error}</p>
        )}
        {success && !error && (
          <p className="text-sm text-[#3f7d3a]">Comment posted successfully!</p>
        )}
      </div>

      {loading && (
        <p className="mt-4 text-sm text-[#94725a]">Loading comments…</p>
      )}

      <div className="mt-6 space-y-4">
        {comments.map((c) => {
          const currentUser = auth.currentUser;
          const isAuthor = !!currentUser && c.userId === currentUser.uid;
          return (
            <div
              key={c.id}
              className="bg-[#fff7ef] border border-[#e2c9ad] p-4 rounded-xl"
            >
              <p className="text-[#3b2419]">{c.text}</p>
              <p className="text-sm text-[#94725a] mt-2">
                — {c.userName || "Reader"}
              </p>
              {isAuthor && (
                <button
                  type="button"
                  onClick={() => deleteComment(c.id)}
                  className="mt-2 text-xs text-red-500 hover:text-red-600 hover:underline"
                >
                  Delete
                </button>
              )}
            </div>
          );
        })}
        {!loading && comments.length === 0 && (
          <p className="text-sm text-[#94725a]">No comments yet.</p>
        )}
      </div>
    </div>
  );
}

