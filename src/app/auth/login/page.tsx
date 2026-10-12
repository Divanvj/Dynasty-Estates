"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import type { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";

import {
  confirmPhoneSignIn,
  createPhoneRecaptcha,
  getFirebaseAuthErrorMessage,
  sendPasswordReset,
  signInWithEmail,
  signInWithGoogle,
  startPhoneSignIn,
} from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [mode, setMode] = useState<"email" | "phone">("email");
  const [phone, setPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  // A spent verifier cannot be reused, so drop it between attempts.
  function resetRecaptcha() {
    try {
      recaptchaRef.current?.clear();
    } catch {
      // Widget may already be gone.
    }
    recaptchaRef.current = null;
  }

  async function handleSendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    try {
      resetRecaptcha();
      recaptchaRef.current = createPhoneRecaptcha("phone-recaptcha");
      const result = await startPhoneSignIn(phone, recaptchaRef.current);
      setConfirmation(result);
      setNotice(`Verification code sent to ${phone}.`);
    } catch (submitError) {
      resetRecaptcha();
      setError(getFirebaseAuthErrorMessage(submitError));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!confirmation) return;
    setError("");
    setLoading(true);

    try {
      await confirmPhoneSignIn(confirmation, smsCode);
      resetRecaptcha();
      router.push("/");
      router.refresh();
    } catch (submitError) {
      setError(getFirebaseAuthErrorMessage(submitError));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setLoading(true);

    try {
      await signInWithGoogle();
      router.push("/");
      router.refresh();
    } catch (submitError) {
      setError(getFirebaseAuthErrorMessage(submitError));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signInWithEmail(email, password);
      const targetPath =
        result && typeof result === "object" && "initialPath" in result && typeof result.initialPath === "string"
          ? result.initialPath
          : "/";
      router.push(targetPath);
      router.refresh();
    } catch (submitError) {
      setError(getFirebaseAuthErrorMessage(submitError));
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset() {
    if (!email) {
      setError("Enter your email address first.");
      return;
    }

    setError("");
    setNotice("");
    setResetLoading(true);

    try {
      await sendPasswordReset(email);
      setNotice("Password reset email sent. Check your inbox.");
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Unable to send the reset email.");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#dfeaf0] dark:bg-[var(--background)] px-4 py-5 text-slate-900 md:px-6 lg:px-8 dark:text-white">
      <div className="mx-auto flex min-h-[calc(100vh-40px)] max-w-[1400px] items-center justify-center">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[36px] border border-white/45 bg-white/45 shadow-[0_20px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr] dark:bg-[#0c1a1c]/90 dark:border-white/10 dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)]">
          <div className="relative hidden min-h-[640px] bg-[linear-gradient(160deg,rgba(15,23,42,0.9),rgba(26,56,68,0.82))] p-8 text-white lg:flex lg:flex-col lg:justify-between dark:bg-[linear-gradient(160deg,#060d0e,#0c2327)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-lg font-semibold text-white dark:bg-emerald-950/60 dark:border dark:border-emerald-500/30 dark:shadow-[0_0_15px_rgba(16,185,129,0.25)] dark:text-emerald-400">
                D
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-slate-200 dark:text-slate-400">Dynasty</p>
                <p className="text-lg font-semibold">Estates</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-emerald-200 dark:text-emerald-400">Property intelligence</p>
              <h1 className="mt-4 max-w-md text-4xl font-semibold leading-tight tracking-[-0.06em]">
                Find homes that fit the way you live.
              </h1>
            </div>

            <div className="rounded-[26px] border border-white/15 bg-white/5 p-5 backdrop-blur-sm dark:bg-[#060d0e]/80 dark:border-white/10 dark:shadow-lg">
              <p className="text-sm text-slate-200 dark:text-slate-300">Recommended for you</p>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-semibold">R 8.9M</p>
                  <p className="text-sm text-slate-300 dark:text-slate-400">Morningside • 4 bed • 3 bath</p>
                </div>
                <div className="rounded-full border border-emerald-300/40 bg-emerald-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-500/40 dark:shadow-[0_0_10px_rgba(16,185,129,0.25)]">
                  4.8 match
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 lg:p-10">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Welcome back</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-slate-900 dark:text-white">Sign in</h2>
              </div>
              <Link href="/" className="text-sm text-slate-600 hover:text-slate-900 transition-colors dark:text-slate-300 dark:hover:text-emerald-400">Back home</Link>
            </div>

            <div className="mb-6 rounded-2xl border border-slate-300/50 bg-white/50 p-4 backdrop-blur-md dark:bg-[#060d0e]/60 dark:border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-700 dark:text-emerald-400">
                Role-based access
              </span>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                Your view of Dynasty Estates is determined by the account you sign in with.
                Visitors browse as a Buyer; Seller, Agent and Admin tools unlock once you sign
                in with credentials for that role.
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white/80 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-70 hover:bg-white transition-all cursor-pointer dark:bg-[#060d0e]/60 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:border-white/20"
              >
                <span>G</span>
                Continue with Google
              </button>

              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white/80 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-white transition-all dark:bg-[#060d0e]/60 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:border-white/20"
              >
                <span></span>
                Continue with Apple
              </button>
            </div>

            <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
              <div className="h-px flex-1 bg-slate-300 dark:bg-white/10" />
              {mode === "email" ? "or with email & password" : "or with your phone"}
              <div className="h-px flex-1 bg-slate-300 dark:bg-white/10" />
            </div>

            <div className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-slate-200/70 p-1 dark:bg-[#060d0e]/80 dark:border dark:border-white/10">
              {(["email", "phone"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setError("");
                    setNotice("");
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    mode === m
                      ? "bg-white text-slate-900 shadow-sm dark:bg-emerald-600 dark:text-white dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  {m === "email" ? "Email" : "Phone"}
                </button>
              ))}
            </div>

            {/* Invisible reCAPTCHA host for phone sign-in */}
            <div id="phone-recaptcha" />

            {mode === "phone" ? (
              confirmation ? (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div>
                    <label htmlFor="sms-code" className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                      Verification code
                    </label>
                    <input
                      id="sms-code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={smsCode}
                      onChange={(event) => setSmsCode(event.target.value)}
                      placeholder="123456"
                      required
                      className="w-full rounded-[18px] border border-slate-200 bg-[#f6f8f8] px-4 py-3 text-sm tracking-[0.3em] text-slate-800 placeholder:tracking-normal placeholder:text-slate-400 focus:outline-none dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500"
                    />
                  </div>

                  {error ? (
                    <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>
                  ) : null}
                  {notice ? (
                    <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300">{notice}</p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-full bg-[#0f172a] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800 transition-all disabled:cursor-not-allowed disabled:opacity-70 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                  >
                    {loading ? "Verifying..." : "Verify & sign in"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setConfirmation(null);
                      setSmsCode("");
                      setNotice("");
                      setError("");
                    }}
                    className="w-full text-center text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-emerald-400"
                  >
                    Use a different number
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSendCode} className="space-y-4">
                  <div>
                    <label htmlFor="phone" className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                      Phone number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="082 123 4567"
                      required
                      className="w-full rounded-[18px] border border-slate-200 bg-[#f6f8f8] px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500"
                    />
                    <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      South African numbers may be entered as 082…; others need a country code.
                    </p>
                  </div>

                  {error ? (
                    <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-full bg-[#0f172a] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800 transition-all disabled:cursor-not-allowed disabled:opacity-70 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                  >
                    {loading ? "Sending code..." : "Send verification code"}
                  </button>
                </form>
              )
            ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  // Without this, password managers and iOS/Android autofill do
                  // not reliably offer saved credentials — costly on a phone,
                  // where typing an address is the slowest thing on the screen.
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-[18px] border border-slate-200 bg-[#f6f8f8] px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  // "current-password" tells a password manager this is a sign-in
                  // rather than a new credential, so it offers the saved one
                  // instead of prompting to generate a replacement.
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-[18px] border border-slate-200 bg-[#f6f8f8] px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-emerald-500" />
                  Remember me
                </label>
                <button type="button" onClick={() => void handlePasswordReset()} disabled={resetLoading} className="text-slate-700 hover:text-slate-900 disabled:opacity-60 dark:text-slate-300 dark:hover:text-emerald-400">
                  {resetLoading ? "Sending..." : "Forgot password?"}
                </button>
              </div>

              {error ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>
              ) : null}
              {notice ? (
                <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300">{notice}</p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[#0f172a] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800 transition-all disabled:cursor-not-allowed disabled:opacity-70 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-[0_0_20px_rgba(16,185,129,0.35)]"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
            )}

            <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
              No account yet? <Link href="/auth/signup" className="font-semibold text-slate-900 hover:underline dark:text-emerald-400">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
