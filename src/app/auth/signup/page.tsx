"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import {
  getFirebaseAuthErrorMessage,
  signInWithGoogle,
  signUpWithEmail,
} from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      await signUpWithEmail(email, password, fullName);
      router.push("/");
      router.refresh();
    } catch (submitError) {
      setError(getFirebaseAuthErrorMessage(submitError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#dfeaf0] dark:bg-[var(--background)] px-4 py-5 text-slate-900 md:px-6 lg:px-8 dark:text-white">
      <div className="mx-auto flex min-h-[calc(100vh-40px)] max-w-[1400px] items-center justify-center">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[36px] border border-white/45 bg-white/45 shadow-[0_20px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:grid-cols-[1.15fr_0.85fr] dark:bg-[#0c1a1c]/90 dark:border-white/10 dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)]">
          <div className="relative hidden min-h-[660px] bg-[linear-gradient(160deg,rgba(15,23,42,0.92),rgba(11,92,94,0.8))] p-8 text-white lg:flex lg:flex-col lg:justify-between dark:bg-[linear-gradient(160deg,#060d0e,#0c2327)]">
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
              <p className="text-[10px] uppercase tracking-[0.24em] text-emerald-200 dark:text-emerald-400">Your next move</p>
              <h1 className="mt-4 max-w-md text-4xl font-semibold leading-tight tracking-[-0.06em]">
                Save homes, compare matches, and move faster.
              </h1>
            </div>

            <div className="rounded-[26px] border border-white/15 bg-white/5 p-5 backdrop-blur-sm dark:bg-[#060d0e]/80 dark:border-white/10 dark:shadow-lg">
              <p className="text-sm text-slate-200 dark:text-slate-300">Curated for you</p>
              <div className="mt-4 space-y-3 text-sm text-slate-100 dark:text-slate-300">
                <p>• Personalised shortlist</p>
                <p>• Market alerts and property updates</p>
                <p>• AI-guided lifestyle recommendations</p>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 lg:p-10">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">New account</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-slate-900 dark:text-white">Create profile</h2>
              </div>
              <Link href="/" className="text-sm text-slate-600 hover:text-slate-900 transition-colors dark:text-slate-300 dark:hover:text-emerald-400">Home</Link>
            </div>

            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white/80 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-70 hover:bg-white transition-all cursor-pointer dark:bg-[#060d0e]/60 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:border-white/20"
              >
                <span>G</span>
                Continue with Google
              </button>
            </div>

            <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
              <div className="h-px flex-1 bg-slate-300 dark:bg-white/10" />
              or with email & password
              <div className="h-px flex-1 bg-slate-300 dark:bg-white/10" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="fullName" className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Full name
                </label>
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Your full name"
                  required
                  className="w-full rounded-[18px] border border-slate-200 bg-[#f6f8f8] px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500"
                />
              </div>

              <div>
                <label htmlFor="signup-email" className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-[18px] border border-slate-200 bg-[#f6f8f8] px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500"
                />
              </div>

              <div>
                <label htmlFor="signup-password" className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Password
                </label>
                <input
                  id="signup-password"
                  type="password"
                  // "new-password" here, not "current-password": it prompts a
                  // password manager to generate and save a credential rather
                  // than autofilling an existing one into a registration form.
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create a password"
                  required
                  minLength={6}
                  className="w-full rounded-[18px] border border-slate-200 bg-[#f6f8f8] px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500"
                />
              </div>

              {error ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[#0f172a] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800 transition-all disabled:cursor-not-allowed disabled:opacity-70 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-[0_0_20px_rgba(16,185,129,0.35)]"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
              Already have an account? <Link href="/auth/login" className="font-semibold text-slate-900 hover:underline dark:text-emerald-400">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
