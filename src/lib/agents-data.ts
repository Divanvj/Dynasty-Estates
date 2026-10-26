export type AgentProfile = {
  id: string;
  slug: string;
  name: string;
  agency: string;
  agencyId: string;
  ffcNumber: string; // PPRA Fidelity Fund Certificate
  specialty: string;
  location: string;
  activeMandates: number;
  phone: string;
  email: string;
  image: string;
  bio: string;
};

export const verifiedPractitioners: AgentProfile[] = [
  {
    id: "agent-sherry",
    slug: "sherry-gallagher",
    name: "Sherry Gallagher",
    agency: "Dynasty Prestige Mandates",
    agencyId: "agency-prestige",
    ffcNumber: "PPRA-2026-781920",
    specialty: "Luxury Estates & Diplomatic Residences",
    location: "Waterkloof & Pretoria East, Gauteng",
    activeMandates: 6,
    phone: "+27 82 890 1234",
    email: "sherry.g@dynastyestates.co.za",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
    bio: "With over 14 years specializing in prime Pretoria East estates and ambassadorial residences, Sherry provides discrete, high-touch property advisory with verified statutory PPRA certification.",
  },
  {
    id: "agent-marcus",
    slug: "marcus-vander-merwe",
    name: "Marcus van der Merwe",
    agency: "Dynasty Atlantic Seaboard & Coastal",
    agencyId: "agency-coastal",
    ffcNumber: "PPRA-2026-554219",
    specialty: "Oceanfront Mansions & Ultra-Luxury Penthouses",
    location: "Camps Bay & Clifton, Cape Town, Western Cape",
    activeMandates: 8,
    phone: "+27 83 456 7890",
    email: "marcus.v@dynastyestates.co.za",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80",
    bio: "Marcus heads Atlantic Seaboard prime transactions, delivering exceptional marketing and buyer matching across Camps Bay, Clifton, and the V&A Waterfront.",
  },
  {
    id: "agent-thandi",
    slug: "thandi-khumalo",
    name: "Thandi Khumalo",
    agency: "Dynasty Commercial & Developments",
    agencyId: "agency-commercial",
    ffcNumber: "PPRA-2026-904321",
    specialty: "High-Yield Clusters & Secure Family Estates",
    location: "Sandton & Bryanston, Johannesburg, Gauteng",
    activeMandates: 5,
    phone: "+27 81 234 5678",
    email: "thandi.k@dynastyestates.co.za",
    image: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=600&q=80",
    bio: "An energetic practitioner known for deep market valuation accuracy and rapid negotiation turnaround across Sandton, Morningside, and Bryanston cluster developments.",
  },
];

export function getAgentByIdOrSlug(idOrSlug: string): AgentProfile | null {
  const normalized = idOrSlug.toLowerCase().trim();
  return (
    verifiedPractitioners.find(
      (agent) => agent.id.toLowerCase() === normalized || agent.slug.toLowerCase() === normalized
    ) ?? null
  );
}
