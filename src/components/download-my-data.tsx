"use client";

import Link from "next/link";
import { useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { useAuthHref } from "@/lib/use-return-path";

/**
 * "Download my data": a JSON file of everything the signed-in account gave
 * Dynasty Estates (/api/account/export, audit item 2.5). Signed out, it says
 * to sign in first, with a link back here.
 */
export default function DownloadMyData() {
  const { user } = useAuth();
  const signInHref = useAuthHref();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!user) {
    return (
      <p className="text-sm text-slate-700 dark:text-slate-300">
        <Link href={signInHref} className="font-semibold text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-300">
          Sign in
        </Link>{" "}
        to download a copy of the information your account holds.
      </p>
    );
  }

  async function download() {
    if (!user) return;
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/account/export", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Your data couldn’t be downloaded. Try again in a moment.");
      }
      const blob = await response.blob();
      const name = /filename="([^"]+)"/.exec(response.headers.get("content-disposition") ?? "")?.[1] ?? "dynasty-estates-my-data.json";
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Your data couldn’t be downloaded.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void download()}
        disabled={busy}
        className="pill-lg bg-emerald-700 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60 dark:bg-emerald-700 dark:hover:bg-emerald-600"
      >
        {busy ? "Preparing your file…" : "Download my data"}
      </button>
      {done ? (
        <p role="status" className="text-sm text-slate-700 dark:text-slate-300">
          Your file has downloaded. It is a JSON file you can open in any text editor.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
