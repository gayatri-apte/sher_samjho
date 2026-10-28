import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  RecaptchaVerifier,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  updateProfile,
  type ConfirmationResult,
} from "firebase/auth";
import { auth } from "../../services/firebase";
import { guestLogin } from "../../services/auth.service";

const googleProvider = new GoogleAuthProvider();

const MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Wrong email or password.",
  "auth/wrong-password": "Wrong email or password.",
  "auth/user-not-found": "No account with that email — create one below.",
  "auth/email-already-in-use": "That email already has an account — sign in instead.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/popup-closed-by-user": "Google sign-in was closed.",
  "auth/popup-blocked": "Your browser blocked the Google pop-up. Allow pop-ups and retry.",
  "auth/operation-not-allowed": "This sign-in method isn't enabled in Firebase Console → Authentication.",
  "auth/invalid-phone-number": "Enter the phone number with country code, e.g. +919876543210.",
  "auth/invalid-verification-code": "That OTP is incorrect.",
  "auth/too-many-requests": "Too many attempts. Please wait a bit and try again.",
};

function friendly(err: unknown) {
  const code = (err as { code?: string })?.code ?? "";
  return MESSAGES[code] ?? (err instanceof Error ? err.message : "Something went wrong");
}

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const next = location.state?.from || "/";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function run(fn: () => Promise<unknown>, go = true) {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      await fn();
      if (go) navigate(next, { replace: true });
    } catch (err) {
      setError(friendly(err));
    } finally {
      setLoading(false);
    }
  }

  function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    void run(async () => {
      if (mode === "signin") {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
      }
    });
  }

  function resetPassword() {
    if (!email.trim()) {
      setError("Enter your email above first, then tap “Forgot password?”.");
      return;
    }
    void run(async () => {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo("Password reset link sent — check your inbox.");
    }, false);
  }

  function sendOTP() {
    void run(async () => {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      }
      const result = await signInWithPhoneNumber(auth, phone.trim(), window.recaptchaVerifier);
      setConfirmation(result);
      setInfo("OTP sent.");
    }, false);
  }

  const input =
    "w-full px-3 py-2.5 rounded-xl bg-[#fbeee0] border border-[#e2c9ad] placeholder:text-[#c39a79] text-sm focus:outline-none focus:ring-2 focus:ring-[#c26a3b]/50";

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10 bg-cover bg-no-repeat bg-center"
      style={{ backgroundImage: "url('/images/background-pattern-soft.png')" }}
    >
      <div className="w-full max-w-md rounded-3xl border border-[#e2c9ad] p-8 bg-[#fff7ef] shadow-xl text-[#3b2419]">
        <div className="mb-6 text-center">
          <p className="text-xs tracking-[0.2em] uppercase text-[#a58668]">Sher Samjho</p>
          <h1 className="text-2xl font-semibold mt-2">
            {mode === "signin" ? "Khush aamdeed — welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-[#94725a] mt-1">Understand, hear and recite Urdu poetry.</p>
        </div>

        <form className="space-y-4" onSubmit={submitEmail}>
          {mode === "signup" && (
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-sm font-medium text-[#5a3a28]">Name</label>
              <input id="name" value={name} onChange={(e) => setName(e.target.value)} className={input} placeholder="Shown on the leaderboard" />
            </div>
          )}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-[#5a3a28]">Email</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} placeholder="you@example.com" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-[#5a3a28]">Password</label>
              {mode === "signin" && (
                <button type="button" onClick={resetPassword} className="text-xs text-[#c26a3b] hover:underline">
                  Forgot password?
                </button>
              )}
            </div>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={input}
              placeholder={mode === "signin" ? "Your password" : "At least 6 characters"}
            />
          </div>

          {error && <p className="text-sm text-[#8a2a1a]" role="alert">{error}</p>}
          {info && <p className="text-sm text-[#3f7d3a]" role="status">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-full bg-[#c26a3b] hover:bg-[#a9552a] text-white text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="mt-3 text-sm text-center text-[#7d5b44]">
          {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError("");
            }}
            className="text-[#c26a3b] font-medium hover:underline"
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#e7cfb4]" />
          <span className="text-xs text-[#b08a6a] uppercase tracking-[0.2em]">or</span>
          <div className="h-px flex-1 bg-[#e7cfb4]" />
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => run(() => signInWithPopup(auth, googleProvider))}
          className="w-full py-2.5 rounded-full bg-white text-[#3b2419] text-sm font-medium border border-[#e2c9ad] hover:bg-[#fff3e4] disabled:opacity-50"
        >
          Continue with Google
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => run(guestLogin)}
          className="w-full py-2.5 mt-3 rounded-full border border-[#e2c9ad] text-sm hover:bg-[#f6e2cf] disabled:opacity-50"
        >
          Try it as a guest
        </button>

        <details className="mt-6 pt-5 border-t border-[#e7cfb4]">
          <summary className="cursor-pointer text-sm font-medium text-[#5a3a28]">Use phone number (OTP)</summary>
          <div className="mt-3 space-y-2">
            <input placeholder="+91XXXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} className={input} inputMode="tel" />
            <button type="button" disabled={loading || !phone.trim()} onClick={sendOTP} className="w-full py-2 rounded-full bg-[#e2c9ad] text-sm hover:bg-[#d6b897] disabled:opacity-50">
              Send OTP
            </button>
            {confirmation && (
              <>
                <input placeholder="6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} className={input} inputMode="numeric" />
                <button
                  type="button"
                  disabled={loading || !otp.trim()}
                  onClick={() => run(() => confirmation.confirm(otp.trim()))}
                  className="w-full py-2 rounded-full bg-[#4c7a4a] text-white text-sm hover:bg-[#3c6a3a] disabled:opacity-50"
                >
                  Verify OTP
                </button>
              </>
            )}
          </div>
        </details>
        <div id="recaptcha-container" />
      </div>
    </div>
  );
}
