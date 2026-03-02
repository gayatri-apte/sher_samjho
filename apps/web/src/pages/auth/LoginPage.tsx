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
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10 bg-cover bg-no-repeat bg-center"
      style={{backgroundImage: "url('/images/background-pattern-soft.png')"}}
    >
      <div className="w-full max-w-md rounded-2xl border border-[#e2c9ad] p-8 bg-[#fff7ef] shadow-xl">
        <div className="mb-6 text-center">
          <p className="text-xs tracking-[0.2em] uppercase text-[#a58668]">
            Sher Samjho
          </p>
          <h2 className="text-2xl font-semibold mt-2 text-[#3b2419]">
            Welcome back
          </h2>
          <p className="text-sm text-[#94725a] mt-1">
            Sign in to continue your poetry journey.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#5a3a28]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#f6e2cf] border border-[#e2c9ad] placeholder:text-[#c39a79] text-sm focus:outline-none focus:ring-2 focus:ring-[#c26a3b]/50"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-[#5a3a28]">
                Password
              </label>
              <button
                type="button"
                className="text-xs text-[#c26a3b] hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#f6e2cf] border border-[#e2c9ad] placeholder:text-[#c39a79] text-sm focus:outline-none focus:ring-2 focus:ring-[#c26a3b]/50"
              placeholder="Enter your password"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[#c26a3b] hover:bg-[#a9552a] text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Signing in..." : "Continue"}
          </button>
        </form>

        <p className="mt-3 text-[11px] text-center text-[#b08a6a]">
          By continuing, you agree to our{" "}
          <span className="underline">Terms</span> and{" "}
          <span className="underline">Privacy Policy</span>.
        </p>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#e7cfb4]" />
          <span className="text-xs text-[#b08a6a] uppercase tracking-[0.2em]">
            Or continue with
          </span>
          <div className="h-px flex-1 bg-[#e7cfb4]" />
        </div>

        {/* 🔹 Google Login Button */}
        <button
          onClick={loginWithGoogle}
          className="w-full py-2.5 rounded-lg bg-white text-[#3b2419] text-sm font-medium border border-[#e2c9ad] hover:bg-[#fff3e4] transition-colors"
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
          className="w-full py-2 mt-3 rounded-lg border border-[#e2c9ad] text-[#3b2419] text-sm hover:bg-[#f6e2cf] disabled:opacity-50 transition-colors"
        >
          Continue as guest
        </button>

        {/* 🔹 Phone OTP Login */}
        <div className="mt-6 pt-5 border-t border-[#e7cfb4] space-y-3">
          <p className="text-xs font-medium text-[#5a3a28]">
            Prefer using your phone?
          </p>
          <div className="space-y-2">
            <input
              placeholder="+91XXXXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#f6e2cf] border border-[#e2c9ad] placeholder:text-[#c39a79] text-sm focus:outline-none focus:ring-2 focus:ring-[#c26a3b]/40"
            />

            <button
              onClick={sendOTP}
              className="w-full py-2 rounded-lg bg-[#e2c9ad] text-[#3b2419] text-sm hover:bg-[#d6b897] transition-colors"
            >
              Send OTP
            </button>
          </div>

          <div className="space-y-2">
            <input
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#f6e2cf] border border-[#e2c9ad] placeholder:text-[#c39a79] text-sm focus:outline-none focus:ring-2 focus:ring-[#c26a3b]/40"
            />

            <button
              onClick={verifyOTP}
              className="w-full py-2 rounded-lg bg-[#4c9a5a] text-white text-sm hover:bg-[#3c7a48] transition-colors"
            >
              Verify OTP
            </button>
          </div>
        </div>

        {/* 🔹 Recaptcha Container (REQUIRED) */}
        <div id="recaptcha-container" />
      </div>
    </div>
  );
}
