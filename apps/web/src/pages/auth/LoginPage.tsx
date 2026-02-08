import { signInWithEmailAndPassword } from "firebase/auth";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "firebase/auth";

import { useNavigate } from "react-router-dom";
import { auth } from "../../services/firebase";
import { guestLogin } from "../../services/auth.service";
import { useState } from "react";

const googleProvider = new GoogleAuthProvider();

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // 🔹 Phone auth state (ADDED)
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState<any>(null);

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

  // 🔹 Google Login (ADDED)
  async function loginWithGoogle() {
    await signInWithPopup(auth, googleProvider);
    navigate("/scan");
  }

  // 🔹 Phone OTP logic (ADDED)
  function setupRecaptcha() {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { size: "invisible" }
      );
    }
  }

  async function sendOTP() {
    setupRecaptcha();
    const appVerifier = (window as any).recaptchaVerifier;

    const result = await signInWithPhoneNumber(
      auth,
      phone,
      appVerifier
    );

    setConfirmation(result);
  }

  async function verifyOTP() {
    await confirmation.confirm(otp);
    navigate("/scan");
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

        {/* 🔹 Google Login Button (ADDED) */}
        <button
          onClick={loginWithGoogle}
          className="w-full py-3 mt-4 rounded-xl bg-white text-black font-medium"
        >
          Continue with Google
        </button>

        <button
          type="button"
          onClick={async () => {
            setLoading(true);
            setError("");
            try {
              await guestLogin();
              navigate("/scan");
            } catch (err: any) {
              const code = err?.code ?? "";
              if (code === "auth/operation-not-allowed") {
                setError(
                  "Guest sign-in is disabled. Enable Anonymous sign-in in Firebase Console → Authentication → Sign-in method."
                );
              } else {
                setError(err?.message ?? "Guest sign-in failed");
              }
            } finally {
              setLoading(false);
            }}
          }
          disabled={loading}
          className="w-full py-2 mt-3 rounded border border-neutral-600 text-neutral-300 hover:bg-neutral-800 disabled:opacity-50"
        >
          Continue as guest
        </button>

        {/* 🔹 Phone OTP Login (ADDED) */}
        <div className="mt-6 space-y-3">
          <input
            placeholder="+91XXXXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-2 rounded bg-neutral-800 border border-neutral-700"
          />

          <button
            onClick={sendOTP}
            className="w-full py-2 rounded bg-neutral-700"
          >
            Send OTP
          </button>

          <input
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full px-4 py-2 rounded bg-neutral-800 border border-neutral-700"
          />

          <button
            onClick={verifyOTP}
            className="w-full py-2 rounded bg-green-600"
          >
            Verify OTP
          </button>
        </div>

        {/* 🔹 Recaptcha Container (REQUIRED) */}
        <div id="recaptcha-container" />
      </div>
    </div>
  );
}
