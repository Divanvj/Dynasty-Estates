"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * A panel that slides in from an edge: the navigation drawer, the filter sheet,
 * the map's results sheet.
 *
 * This is the first shared overlay in the app. Seven call sites currently
 * hand-roll their own `fixed inset-0 … role="dialog"` markup and each one
 * implements a different subset of the behaviour — most have no Escape handler,
 * only one restores the body's original `overflow` rather than blanking it, and
 * **not one of them traps focus**, so tabbing out of an open modal walks the
 * page behind it. Everything that was right in those seven is gathered here and
 * everything that was missing is added once.
 *
 * Deliberately a portal onto `document.body`: these open from headers and cards
 * that own their own stacking contexts and `overflow` (the search panel already
 * learned this), and an in-tree overlay gets clipped or buried by them.
 */

/** Must match the exit animation's duration below, or the panel vanishes mid-slide. */
const EXIT_MS = 200;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export type SheetSide = "left" | "bottom";

export default function Sheet({
  open,
  onClose,
  side = "left",
  label,
  className = "",
  children,
}: {
  open: boolean;
  onClose: () => void;
  side?: SheetSide;
  /** Names the dialog for screen readers. Six of the seven existing overlays have no label. */
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  // `render` outlives `open` by one exit animation, so the panel slides out
  // instead of disappearing between frames.
  const [render, setRender] = useState(open);
  const [closing, setClosing] = useState(false);

  // Derived from `open` during render, not in an effect — the same shape
  // `site-navigation.tsx:166-170` uses to close its dropdowns on a route
  // change. A ref would read more naturally but the compiler rules forbid
  // touching one during render, and an effect would schedule a second render
  // pass per toggle.
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setRender(true);
      setClosing(false);
    } else if (render) {
      setClosing(true);
    }
  }

  // The exit timer has to be an effect, but it sets state asynchronously from
  // the timeout rather than synchronously on mount, so it does not cascade.
  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(() => {
      setRender(false);
      setClosing(false);
    }, EXIT_MS);
    return () => clearTimeout(timer);
  }, [closing]);

  // Remember what was focused before we opened, and put focus back there on the
  // way out — otherwise closing a drawer dumps the caret at the top of the
  // document and a keyboard user has to tab all the way back.
  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // A frame's grace: the panel has to exist before anything in it can take focus.
    const focusTimer = setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panelRef.current)?.focus();
    }, 50);

    return () => {
      clearTimeout(focusTimer);
      // Restore, do not blank. Blanking it discards whatever the page had set
      // and silently re-enables scrolling under any overlay still open.
      document.body.style.overflow = originalOverflow;
      restoreFocusRef.current?.focus?.();
    };
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  // No `mounted` flag needed: `open` starts false and only a client interaction
  // can raise it, so the portal is never reached during SSR. The `document`
  // guard is belt and braces for any caller that opens on first paint.
  if (!render || typeof document === "undefined") return null;

  const sidePosition =
    side === "left"
      ? "inset-y-0 left-0 w-[min(88vw,22rem)] rounded-r-3xl"
      : "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-3xl";

  const sideMotion =
    side === "left"
      ? closing
        ? "animate-out slide-out-to-left-full"
        : "animate-in slide-in-from-left-full"
      : closing
        ? "animate-out slide-out-to-bottom-full"
        : "animate-in slide-in-from-bottom-full";

  return createPortal(
    <>
      {/* z-[9990]: clears MobileNav at z-[80] and every page header at z-50,
          while staying under the tenant-application modal at z-[99999]. */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-[9990] bg-slate-950/50 backdrop-blur-xs duration-200 ${
          closing ? "animate-out fade-out" : "animate-in fade-in"
        }`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={`fixed z-[9991] flex flex-col overflow-hidden border-white/70 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.35)] duration-200 outline-none dark:border-white/10 dark:bg-[#0a1517] ${sidePosition} ${sideMotion} ${className}`}
      >
        {children}
      </div>
    </>,
    document.body,
  );
}
