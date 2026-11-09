"use client";

import { useState } from "react";

/**
 * How to fix a failing check. Commands (anything starting with npx/node/git)
 * render as code with a copy button; prose renders as prose.
 */
export function CopyFix({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const commandMatch = text.match(/((?:npx(?:\.cmd)?|node|git) [^\n]+)$/);
  const prose = commandMatch ? text.slice(0, commandMatch.index).replace(/[:\s]+$/, "") : text;
  const command = commandMatch?.[1];

  return (
    <div className="mt-3 rounded-lg bg-white/[0.03] px-3 py-2.5">
      {prose ? <p className="text-xs leading-relaxed text-[var(--ink-muted)]"><span className="font-semibold text-[var(--ink)]">Fix: </span>{prose}</p> : null}
      {command ? (
        <div className="mt-2 flex items-center gap-2">
          <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-md bg-black/40 px-2.5 py-1.5 font-mono text-xs text-[var(--ink)]">
            {command}
          </code>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(command).then(() => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1500);
              });
            }}
            className="min-h-8 shrink-0 cursor-pointer rounded-md border border-white/10 px-2.5 text-xs font-semibold text-[var(--ink-muted)] hover:bg-white/[0.06] hover:text-[var(--ink)]"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
