"use client";

import { useId, useState } from "react";

type Props = {
  text: string;
  /** Typography for the paragraph itself; the clamp and spacing are ours. */
  className?: string;
};

/**
 * A block of prose that is clamped on a phone and whole from `md` up.
 *
 * The listing description measured 336px on a 375px screen — most of half a
 * viewport before a visitor reached a single specification. Private Property
 * holds the equivalent block to 240px and puts the rest behind a tap.
 *
 * Nothing is hidden from anything that is not a human eye: the full text is
 * always in the DOM, so search engines and screen readers get all of it, and
 * `line-clamp` only ever trims what is painted. The toggle is `md:hidden`
 * because above that breakpoint there is no clamp for it to undo.
 */
export default function ExpandableText({ text, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <div className="mt-4">
      {/* The two clamp states are written out in full rather than composed,
          because Tailwind reads class names out of the source as literal
          strings — a name built at runtime is never generated. */}
      <p id={id} className={`${className} ${open ? "" : "max-md:line-clamp-4"}`}>
        {text}
      </p>
      <button
        type="button"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        aria-expanded={open}
        aria-controls={id}
        className="tap-44 relative mt-1.5 inline-flex cursor-pointer font-bold text-emerald-800 underline underline-offset-2 md:hidden dark:text-emerald-400"
      >
        {open ? "Show less" : "Read more"}
      </button>
    </div>
  );
}
