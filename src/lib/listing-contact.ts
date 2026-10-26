import type { PropertyRecord } from "@/lib/property-data";
import { authoritativeAgencies, authoritativeAgents } from "@/lib/server/property-service";
import { absoluteUrl } from "@/lib/site-url";

export type ListingContact = {
  name: string;
  agencyName: string | null;
  /** As written, for display. */
  phoneDisplay: string;
  /** `tel:` href — E.164, no spaces. */
  telHref: string;
  /** `wa.me` href with the listing already described in the message. */
  whatsappHref: string;
  isVerified: boolean;
};

/**
 * Digits only, which is what wa.me requires — it rejects `+`, spaces and dashes.
 * A South African number entered as 082… is normalised to 2782…
 */
function toWhatsAppDigits(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("27")) return digits;
  if (digits.startsWith("0")) return `27${digits.slice(1)}`;
  return digits;
}

function toTelHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  return `tel:${digits.startsWith("+") ? digits : `+${toWhatsAppDigits(phone) ?? digits}`}`;
}

/**
 * The practitioner to contact about a listing, or null when nobody is assigned.
 *
 * Reads the listing's own `agentId`. An earlier version guessed by matching the
 * property's suburb against each agency's `areasServed` and fell back to the
 * first agent in the list — which meant a listing with no practitioner showed a
 * real, unrelated person's mobile number. Returning null instead hides the
 * direct-contact channels and leaves the enquiry form, which is the honest
 * outcome: a seller listing has no agent to phone.
 */
export function getListingContact(property: PropertyRecord): ListingContact | null {
  if (!property.agentId) return null;

  const agent = authoritativeAgents.find((candidate) => candidate.id === property.agentId) ?? null;
  if (!agent?.phone) return null;

  const agency = authoritativeAgencies.find((candidate) => candidate.id === agent.agencyId) ?? null;

  const waDigits = toWhatsAppDigits(agent.phone);
  const listingUrl = absoluteUrl(`/property/${property.slug}`);

  // Naming the property and its price turns "Hi, is this still available?" into
  // an enquiry the agent can act on without asking which listing it is about.
  const message = [
    `Hi ${agent.name.split(" ")[0]}, I'm interested in ${property.title}`,
    `(${property.price}${property.suburb ? `, ${property.suburb}` : ""}).`,
    listingUrl,
  ].join(" ");

  return {
    name: agent.name,
    agencyName: agency?.name ?? null,
    phoneDisplay: agent.phone,
    telHref: toTelHref(agent.phone),
    whatsappHref: waDigits
      ? `https://wa.me/${waDigits}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`,
    isVerified: Boolean(agent.isVerified),
  };
}
