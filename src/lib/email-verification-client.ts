import { auth } from "./firebase";

/**
 * Asks the server to e-mail the signed-in account a link to confirm its
 * address (src/app/api/auth/verify-email). Returns the server's outcome, or
 * an error message to show.
 */
export type VerificationRequestResult =
  | { ok: true; status: string }
  | { ok: false; message: string };

export async function requestVerificationEmail(reason: "signup" | "resend"): Promise<VerificationRequestResult> {
  const user = auth?.currentUser;
  if (!user) return { ok: false, message: "Sign in first." };
  try {
    const token = await user.getIdToken();
    const response = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason }),
      keepalive: true,
    });
    const body = (await response.json().catch(() => ({}))) as { status?: string; error?: string };
    if (!response.ok) return { ok: false, message: body.error ?? "The e-mail couldn't be sent. Try again in a minute." };
    return { ok: true, status: body.status ?? "sent" };
  } catch {
    return { ok: false, message: "The e-mail couldn't be sent. Check your connection and try again." };
  }
}

/** What to tell the person after they ask for the link again. */
export function resendMessage(result: VerificationRequestResult, email: string): string {
  if (!result.ok) return result.message;
  switch (result.status) {
    case "sent":
      return `We sent a new link to ${email}.`;
    case "skipped":
      return "E-mail sending isn't set up on this site yet, so no link was sent.";
    case "too_soon":
      return "We just sent one. Wait a minute before asking again.";
    case "daily_limit":
      return "We've sent several links today. Check your spam folder, or try again tomorrow.";
    case "undeliverable":
      return "This address can't receive e-mail (it's a test address), so no link was sent.";
    case "already_verified":
      return "Your e-mail address is already confirmed.";
    default:
      return "The e-mail couldn't be sent. Try again in a minute.";
  }
}
