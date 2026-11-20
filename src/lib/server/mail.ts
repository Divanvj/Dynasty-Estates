import { readPlatformConfig } from "./platform-config";
import { adminApp, adminDb } from "./firebase-admin";
import { oneClickUnsubscribeUrl, readEmailPrefs } from "./email-prefs";
import type { EmailPref } from "@/lib/email-prefs";
import type { FeatureFlag } from "@/lib/platform-config";

/**
 * Outgoing e-mail. Server-only.
 *
 * The provider is chosen by which API key is set, so moving to another
 * provider before launch is a matter of setting its key (and removing the old
 * one), not of changing the callers:
 *   BREVO_API_KEY   → Brevo (free plan: 300 e-mails a day, sender address verified in Brevo)
 *   RESEND_API_KEY  → Resend (needs a verified domain to send to anyone but the account owner)
 * MAIL_FROM_EMAIL / MAIL_FROM_NAME set the sender; with Brevo the address must
 * be a verified sender in the Brevo account.
 *
 * Every attempt (sent, skipped or failed) is written to `mail_log`, read only
 * by the developer console through the Admin SDK (no client rule allows it).
 */

export type MailKind = "enquiry" | "agency_invite" | "ops_alert" | "weekly_report" | "saved_search" | "price_drop" | "verify_email" | "ffc_reminder" | "test";

/** Which /console/flags switch governs each kind of e-mail. Test e-mails always go. */
export const MAIL_SWITCH: Record<MailKind, FeatureFlag | null> = {
  enquiry: "emailEnquiryAlerts",
  agency_invite: "emailAgencyInvites",
  ops_alert: "emailOpsAlerts",
  weekly_report: "emailWeeklyReports",
  saved_search: "emailSavedSearchAlerts",
  price_drop: "emailPriceDropAlerts",
  ffc_reminder: "emailComplianceReminders",
  // Account e-mails always go: without one a new account cannot be confirmed.
  verify_email: null,
  test: null,
};

export type MailMessage = {
  kind: MailKind;
  to: { email: string; name?: string };
  subject: string;
  text: string;
  html: string;
  /** Where a reply goes, e.g. the buyer who sent an enquiry. */
  replyTo?: { email: string; name?: string };
  /** What the e-mail is about, for the log (listing id, invite id…). */
  ref?: string;
  /**
   * An e-mail the recipient can turn off (lib/email-prefs.ts): not sent when
   * they have, and sent with a one-click List-Unsubscribe header when it is.
   * The template carries the visible "stop these e-mails" link itself.
   */
  optOut?: { uid: string; pref: EmailPref };
};

export type MailResult =
  | { status: "sent"; provider: string; messageId: string | null }
  | { status: "skipped"; reason: string }
  | { status: "failed"; provider: string; error: string };

export const MAIL_LOG = "mail_log";

type Provider = {
  name: "brevo" | "resend";
  send: (message: MailMessage, from: { email: string; name: string }) => Promise<string | null>;
};

function brevo(apiKey: string): Provider {
  return {
    name: "brevo",
    async send(message, from) {
      const headers = unsubscribeHeaders(message);
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          sender: from,
          to: [message.to],
          subject: message.subject,
          htmlContent: message.html,
          textContent: message.text,
          ...(message.replyTo ? { replyTo: message.replyTo } : {}),
          ...(headers ? { headers } : {}),
          tags: [message.kind],
        }),
        signal: AbortSignal.timeout(15000),
      });
      const body = (await response.json().catch(() => ({}))) as { messageId?: string; message?: string; code?: string };
      if (!response.ok) throw new Error(`Brevo ${response.status}: ${body.message ?? body.code ?? "no detail"}`);
      return body.messageId ?? null;
    },
  };
}

function resend(apiKey: string): Provider {
  const address = (a: { email: string; name?: string }) => (a.name ? `${a.name.replace(/[<>"]/g, "")} <${a.email}>` : a.email);
  return {
    name: "resend",
    async send(message, from) {
      const headers = unsubscribeHeaders(message);
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: address(from),
          to: [address(message.to)],
          subject: message.subject,
          html: message.html,
          text: message.text,
          ...(message.replyTo ? { reply_to: address(message.replyTo) } : {}),
          ...(headers ? { headers } : {}),
          tags: [{ name: "kind", value: message.kind }],
        }),
        signal: AbortSignal.timeout(15000),
      });
      const body = (await response.json().catch(() => ({}))) as { id?: string; message?: string };
      if (!response.ok) throw new Error(`Resend ${response.status}: ${body.message ?? "no detail"}`);
      return body.id ?? null;
    },
  };
}

/** One-click unsubscribe (RFC 8058); Gmail and Yahoo expect it on bulk e-mail. */
function unsubscribeHeaders(message: MailMessage): Record<string, string> | null {
  const url = message.optOut ? oneClickUnsubscribeUrl(message.optOut.uid, message.optOut.pref) : null;
  return url ? { "List-Unsubscribe": `<${url}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } : null;
}

function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

function provider(): Provider | null {
  if (env("BREVO_API_KEY")) return brevo(env("BREVO_API_KEY"));
  if (env("RESEND_API_KEY")) return resend(env("RESEND_API_KEY"));
  return null;
}

/** What the console shows about e-mail set-up. Never includes a key. */
export function mailSetup() {
  const p = provider();
  return {
    provider: p?.name ?? null,
    fromEmail: env("MAIL_FROM_EMAIL") || null,
    fromName: env("MAIL_FROM_NAME") || "Dynasty Estates",
    alertsTo: alertRecipients(),
    ready: Boolean(p && env("MAIL_FROM_EMAIL")),
  };
}

/** Where operations alerts (failed nightly jobs) go: MAIL_ALERTS_TO, comma-separated. */
export function alertRecipients(): string[] {
  return env("MAIL_ALERTS_TO")
    .split(",")
    .map((a) => a.trim().toLowerCase())
    .filter((a) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a));
}

/** Masks an address for the log: "jo***@gmail.com". */
function masked(email: string): string {
  const [user, domain] = email.split("@");
  return `${user.slice(0, 2)}***@${domain ?? ""}`;
}

async function log(message: MailMessage, result: MailResult): Promise<void> {
  if (!adminApp()) return;
  try {
    await adminDb()
      .collection(MAIL_LOG)
      .add({
        kind: message.kind,
        to: masked(message.to.email),
        subject: message.subject.slice(0, 200),
        ref: message.ref ?? null,
        status: result.status,
        provider: "provider" in result ? result.provider : null,
        detail: result.status === "sent" ? result.messageId : result.status === "skipped" ? result.reason : result.error.slice(0, 500),
        at: new Date().toISOString(),
      });
  } catch (error) {
    console.error("[mail] could not write the log:", error);
  }
}

/**
 * Sends one e-mail. Never throws: the caller's own work (saving an enquiry,
 * running the nightly jobs) must not fail because an e-mail did.
 */
export async function sendMail(message: MailMessage): Promise<MailResult> {
  let result: MailResult;
  const p = provider();
  const fromEmail = env("MAIL_FROM_EMAIL");
  const flag = MAIL_SWITCH[message.kind];
  // If the switches can't be read, the defaults (on) apply, as on the site.
  const switchedOn = flag ? ((await readPlatformConfig().catch(() => null))?.config.flags[flag] ?? true) : true;
  // If the preference can't be read, don't send: they may have turned it off.
  const wanted = message.optOut ? await readEmailPrefs(message.optOut.uid).then((p) => p[message.optOut!.pref]).catch(() => false) : true;

  // The recipient's own choice first, so the log says why plainly.
  if (!wanted) {
    result = { status: "skipped", reason: `Turned off by the recipient (${message.optOut!.pref}).` };
  } else if (!p) {
    result = { status: "skipped", reason: "No e-mail provider key is set (BREVO_API_KEY or RESEND_API_KEY)." };
  } else if (!fromEmail) {
    result = { status: "skipped", reason: "MAIL_FROM_EMAIL is not set." };
  } else if (!switchedOn) {
    result = { status: "skipped", reason: `Switched off in /console/flags (${flag}).` };
  } else {
    try {
      const messageId = await p.send(message, { email: fromEmail, name: env("MAIL_FROM_NAME") || "Dynasty Estates" });
      result = { status: "sent", provider: p.name, messageId };
    } catch (error) {
      result = { status: "failed", provider: p.name, error: error instanceof Error ? error.message : String(error) };
      console.error("[mail] send failed:", result.error);
    }
  }
  await log(message, result);
  return result;
}
