import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-8 text-slate-100">
      <div className="relative mx-auto max-w-lg rounded-panel border border-white/10 bg-surface-panel/80 p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
        <span className="inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-emerald-400">
          404 · Page not found
        </span>
        <h1 className="mt-4 text-4xl font-light tracking-tight text-white md:text-5xl">
          We can’t find that page
        </h1>
        {/* slate-300, not slate-600: this card is always dark, and slate-600
            on it measured 1.37:1 (axe, 26 Nov 2026); the floor is 4.5:1. */}
        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          The home or page you’re looking for may have been removed, or the link may be wrong.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="pill-lg bg-gradient-to-r from-emerald-600 to-emerald-700 font-semibold text-white border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all hover:from-emerald-500 hover:to-emerald-600"
          >
            Go to the home page
          </Link>
          <Link
            href="/search"
            className="pill-lg border border-white/10 bg-white/5 font-semibold text-slate-200 transition-all hover:bg-white/10 hover:text-white"
          >
            Search homes
          </Link>
        </div>
      </div>
    </main>
  );
}

