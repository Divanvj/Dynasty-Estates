import type { ListingLifecycleStatus } from "./types/domain";

/**
 * What a moderator can decide about a submitted listing, and what each decision
 * does. Shared by the moderation page and /api/admin/moderation, which applies
 * the decision with the Admin SDK (item 1.3); no Firebase imports, so both the
 * browser and the server can use it.
 */
export type ModerationDecision = "Approved" | "Needs changes" | "Rejected";

export const MODERATION_DECISIONS: readonly ModerationDecision[] = ["Approved", "Needs changes", "Rejected"];

/**
 * Approving a listing publishes it. It used to write "Approved", which is not in
 * the rules' public read list, so a moderator could approve a listing and it
 * would stay invisible to every visitor with nothing reporting a problem.
 * "Approved" remains in the vocabulary for a future two-step review flow.
 */
export function statusForDecision(decision: ModerationDecision): ListingLifecycleStatus {
  switch (decision) {
    case "Approved":
      return "Published";
    case "Needs changes":
      return "Needs changes";
    case "Rejected":
      return "Archived";
  }
}

/** The audit-trail action for a decision: "moderation.approved", "moderation.needs_changes", … */
export function auditActionForDecision(decision: ModerationDecision): string {
  return `moderation.${decision.toLowerCase().replace(" ", "_")}`;
}
