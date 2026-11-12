/**
 * Practitioner compliance types and checks with no Firebase import, so server
 * routes (/api/admin/practitioners) and client pages share them. Firestore
 * access is in ./practitioners.ts.
 */

export type PractitionerStatus = "pending" | "verified" | "rejected";

export type Practitioner = {
  uid: string;
  fullName: string;
  email: string | null;
  phone: string;
  ffcNumber: string;
  /** Fidelity Fund Certificate expiry, "YYYY-MM-DD". */
  ffcExpiry: string;
  /** Free text until agencies exist (Phase G). */
  agencyName: string;
  status: PractitionerStatus;
  submittedAt: Date | null;
  verifiedAt: Date | null;
  decisionNote: string;
};

export type PractitionerInput = Pick<Practitioner, "fullName" | "phone" | "ffcNumber" | "ffcExpiry" | "agencyName">;

export const PRACTITIONER_STATUSES: readonly PractitionerStatus[] = ["pending", "verified", "rejected"];

/** Days before expiry when the agent is warned (PLAN.md Phase F). */
export const EXPIRY_WARNING_DAYS = 60;

export const PPRA_URL = "https://theppra.org.za/";

export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Today's calendar day in South Africa (UTC+2, no daylight saving), "YYYY-MM-DD". */
export function sastToday(now: number = Date.now()): string {
  return new Date(now + 2 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** Whole days from today (SAST) until the given day; negative once it has passed. */
export function daysUntil(day: string, now: number = Date.now()): number | null {
  if (!DATE_PATTERN.test(day)) return null;
  const target = Date.parse(`${day}T00:00:00Z`);
  const today = Date.parse(`${sastToday(now)}T00:00:00Z`);
  if (Number.isNaN(target)) return null;
  return Math.round((target - today) / 86_400_000);
}

export type ComplianceState =
  | { kind: "none" }
  | { kind: "pending" }
  | { kind: "rejected"; note: string }
  | { kind: "verified"; daysLeft: number }
  | { kind: "expiring"; daysLeft: number }
  | { kind: "expired"; daysAgo: number };

/** What the agent is told about their certificate, in one value. */
export function complianceState(record: Practitioner | null, now: number = Date.now()): ComplianceState {
  if (!record) return { kind: "none" };
  const left = daysUntil(record.ffcExpiry, now);
  // An expired certificate is the headline whatever the review status.
  if (left !== null && left < 0) return { kind: "expired", daysAgo: -left };
  if (record.status === "pending") return { kind: "pending" };
  if (record.status === "rejected") return { kind: "rejected", note: record.decisionNote };
  if (left !== null && left <= EXPIRY_WARNING_DAYS) return { kind: "expiring", daysLeft: left };
  return { kind: "verified", daysLeft: left ?? 0 };
}

/** Field checks shared by the form (on blur) and the submit. Empty string = fine. */
export function practitionerFieldError(field: keyof PractitionerInput, value: string, now: number = Date.now()): string {
  const v = value.trim();
  switch (field) {
    case "fullName":
      return v.length < 2 ? "Enter your full name as it appears on your certificate." : "";
    case "phone":
      return v.replace(/\D/g, "").length < 9 ? "Enter a phone number buyers and Dynasty can reach you on." : "";
    case "ffcNumber":
      return v.length < 3 || v.length > 40 ? "Enter the number printed on your Fidelity Fund Certificate." : "";
    case "ffcExpiry": {
      if (!DATE_PATTERN.test(v)) return "Choose the expiry date printed on your certificate.";
      const left = daysUntil(v, now);
      return left !== null && left < 0 ? "This certificate has expired. Enter the date on your current one." : "";
    }
    case "agencyName":
      return v.length > 120 ? "Shorten the agency name to 120 characters." : "";
  }
}
