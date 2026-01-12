import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../../services/firebase";
import { useState } from "react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/scan");
    } catch {
      setError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center h-[calc(100vh-64px)] px-4">
      <div className="w-full max-w-sm rounded-xl border border-neutral-800 p-6 bg-neutral-900">
        <h2 className="text-2xl font-semibold mb-6 text-center">Login</h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 rounded bg-neutral-800 border border-neutral-700"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 rounded bg-neutral-800 border border-neutral-700"
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
