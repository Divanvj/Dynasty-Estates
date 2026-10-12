import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-8 text-slate-100">
      <div className="relative mx-auto max-w-lg rounded-[32px] border border-white/10 bg-[#0c1a1c]/80 p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
        <span className="inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-emerald-400">
          404 · Property Not Located
        </span>
        <h1 className="mt-4 text-4xl font-light tracking-tight text-white md:text-5xl">
          Off the Market
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          The property, collection, or route you are searching for might have been archived, transferred, or never existed in our catalogue.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-3 text-xs font-semibold text-white border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all hover:from-emerald-500 hover:to-emerald-600"
          >
            Explore Flagship Homes
          </Link>
          <Link
            href="/search"
            className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-xs font-semibold text-slate-200 transition-all hover:bg-white/10 hover:text-white"
          >
            Search Catalogue
          </Link>
        </div>
      </div>
    </main>
  );
}

