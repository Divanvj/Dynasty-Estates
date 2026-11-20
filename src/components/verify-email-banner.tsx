"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { InfoCircleIcon } from "@/components/icons";
import { requestVerificationEmail, resendMessage } from "@/lib/email-verification-client";
import { useIsDeveloperAccount } from "@/lib/use-user-role";

/**
 * Asks a signed-in e-mail-and-password account to confirm its address (S1-6)
 * until it does. Hidden on /auth and /console, for Google accounts (they
 * arrive confirmed) and for developer test accounts, whose .test addresses
 * cannot receive mail.
 *
 * Confirming happens on Firebase's page in another tab, so the account is
 * re-read whenever this tab regains focus and the banner goes once it shows
 * as confirmed.
 */
export default function VerifyEmailBanner() {
  const { user } = useAuth();
  const pathname = usePathname();
  const isDeveloper = useIsDeveloperAccount();
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const needsIt =
    Boolean(user?.email) &&
    !user?.emailVerified &&
    Boolean(user?.providerData.some((p) => p.providerId === "password"));

  useEffect(() => {
    if (!user || !needsIt) return;
    const check = () => {
      void user
        .reload()
        .then(() => {
          if (user.emailVerified) {
            setConfirmed(true);
            // A fresh token carries email_verified for the server and rules.
            void user.getIdToken(true);
          }
        })
        .catch(() => undefined);
    };
    window.addEventListener("focus", check);
    return () => window.removeEventListener("focus", check);
  }, [user, needsIt]);

  if (!user || !needsIt || confirmed || isDeveloper) return null;
  if (pathname?.startsWith("/auth") || pathname?.startsWith("/console")) return null;

  async function resend() {
    if (!user?.email) return;
    setBusy(true);
    setMessage("");
    setMessage(resendMessage(await requestVerificationEmail("resend"), user.email));
    setBusy(false);
  }

  return (
    <div
      role="status"
      className="no-print relative z-40 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-xs font-semibold text-amber-950 dark:border-amber-400/25 dark:bg-amber-950/60 dark:text-amber-100"
    >
      <InfoCircleIcon className="mr-1.5 inline h-4 w-4 align-[-3px]" aria-hidden />
      <span>
        Confirm your e-mail address: we sent a link to <span className="break-all">{user.email}</span>.
      </span>{" "}
      <button
        type="button"
        onClick={() => void resend()}
        disabled={busy}
        className="tap-44 ml-1 cursor-pointer underline underline-offset-2 hover:no-underline disabled:cursor-wait disabled:opacity-60"
      >
        {busy ? "Sending…" : "Send the link again"}
      </button>
      {message && (
        <span className="mt-1 block font-medium" aria-live="polite">
          {message}
        </span>
      )}
    </div>
  );
}
