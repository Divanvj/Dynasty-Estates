/**
 * The e-mails a person can turn off for themselves, on /alerts or from the
 * "stop these e-mails" link at the foot of each one. Shared by the browser
 * and the server, so nothing here imports Firebase.
 *
 * Stored server-side only, in `email_prefs/{uid}` (Admin SDK; no client rule),
 * read and written through /api/email/preferences and /api/email/unsubscribe.
 * A missing value means on.
 */

export const EMAIL_PREFS = {
  enquiryEmails: {
    label: "New enquiries on my listings",
    description: "An e-mail each time a buyer or renter sends an enquiry about a home you listed.",
  },
  weeklyReports: {
    label: "Weekly listing report",
    description: "Every Monday: views, saves, contact clicks and enquiries on your live listings over the past week.",
  },
  savedSearchAlerts: {
    label: "Saved-search alerts",
    description: "New homes that match a search you saved, at most once a day.",
  },
  complianceReminders: {
    label: "Certificate expiry reminders",
    description: "For agents: a reminder 60 days, 30 days and a week before your Fidelity Fund Certificate expires.",
  },
} as const;

export type EmailPref = keyof typeof EMAIL_PREFS;
export type EmailPrefs = Record<EmailPref, boolean>;

export const DEFAULT_EMAIL_PREFS: EmailPrefs = { enquiryEmails: true, weeklyReports: true, savedSearchAlerts: true, complianceReminders: true };

export function isEmailPref(value: unknown): value is EmailPref {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(EMAIL_PREFS, value);
}

export function normaliseEmailPrefs(raw: unknown): EmailPrefs {
  const data = (raw ?? {}) as Record<string, unknown>;
  const prefs = { ...DEFAULT_EMAIL_PREFS };
  for (const key of Object.keys(EMAIL_PREFS) as EmailPref[]) {
    if (typeof data[key] === "boolean") prefs[key] = data[key] as boolean;
  }
  return prefs;
}
