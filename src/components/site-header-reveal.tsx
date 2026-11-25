"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Brings the desktop header back as soon as the visitor scrolls up a little
 * (owner, 25 Nov 2026). Before, the header was in the page flow and only
 * reappeared at the very top of the page.
 *
 * The wrapper is sticky at the top. Scrolling down past the header slides it
 * up out of view; any scroll up of a few pixels slides it back. It never
 * hides while focus is inside it (a keyboard user in a menu), and it moves
 * without animation for reduced motion.
 *
 * The wrapper's own padding is transparent, so it lets clicks through to the
 * page behind it; only the header bar itself takes them.
 */
const UP_THRESHOLD = 6; // px of upward scroll that brings the header back
const DOWN_THRESHOLD = 12; // px of downward scroll that hides it again

export default function SiteHeaderReveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);
  // Away from the top the bar floats over listings and text, so it turns
  // nearly opaque there; at the top it keeps its light, see-through look.
  const [floating, setFloating] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    let raf = 0;

    function update() {
      raf = 0;
      const y = window.scrollY;
      const el = ref.current;
      const height = el?.offsetHeight ?? 100;
      const delta = y - last;
      setFloating(y > height);
      if (y <= height) {
        setHidden(false);
        last = y;
      } else if (delta < -UP_THRESHOLD) {
        setHidden(false);
        last = y;
      } else if (delta > DOWN_THRESHOLD) {
        // Keep it on screen while the keyboard is inside it.
        if (!el?.contains(document.activeElement)) setHidden(true);
        last = y;
      }
    }

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      onFocusCapture={() => setHidden(false)}
      className={[
        "no-print pointer-events-none sticky top-0 z-[60] hidden px-8 pt-6 transition-transform duration-300 ease-out motion-reduce:transition-none lg:block",
        hidden ? "-translate-y-[calc(100%+2rem)]" : "translate-y-0",
        floating && "[&>header]:bg-white/90 dark:[&>header]:bg-[#0b1719]/92",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
