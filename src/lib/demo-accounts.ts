import type { UserRole } from "./use-user-role";

export interface DemoAccount {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  initialPath: string;
  description: string;
}

export const DEMO_ACCOUNTS: Record<string, DemoAccount> = {
  "demo.buyer@dynastyestates-demo.com": {
    email: "demo.buyer@dynastyestates-demo.com",
    password: "DynastyBuyer2026!",
    displayName: "Thabo Mokoena (Buyer Demo)",
    role: "Buyer",
    initialPath: "/search",
    description: "Property discovery, saved listings, and enquiry management.",
  },
  "demo.seller@dynastyestates-demo.com": {
    email: "demo.seller@dynastyestates-demo.com",
    password: "DynastySeller2026!",
    displayName: "Sarah Jenkins (Seller Demo)",
    role: "Seller",
    initialPath: "/seller/portal",
    description: "Private seller portal and listing submission workflow.",
  },
  "demo.agent@dynastyestates-demo.com": {
    email: "demo.agent@dynastyestates-demo.com",
    password: "DynastyAgent2026!",
    displayName: "Liam van der Merwe (Agent Demo)",
    role: "Agent",
    initialPath: "/agent/dashboard",
    description: "Real estate practitioner console, mandate control, and CRM leads.",
  },
  "demo.admin@dynastyestates-demo.com": {
    email: "demo.admin@dynastyestates-demo.com",
    password: "DynastyAdmin2026!",
    displayName: "Platform Moderator (Admin Demo)",
    role: "Admin",
    initialPath: "/admin",
    description: "Platform administration console, moderation, and compliance.",
  },
};

export function isDemoEmail(email: string): boolean {
  return email.trim().toLowerCase() in DEMO_ACCOUNTS;
}

export function authenticateDemoUser(email: string, password: string): DemoAccount | null {
  const normalized = email.trim().toLowerCase();
  const account = DEMO_ACCOUNTS[normalized];
  if (account && account.password === password) {
    return account;
  }
  return null;
}

export function getDemoUserByEmail(email: string): DemoAccount | null {
  const normalized = email.trim().toLowerCase();
  return DEMO_ACCOUNTS[normalized] ?? null;
}

