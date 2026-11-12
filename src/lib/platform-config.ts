/**
 * Site-wide switches set from the developer console (/console/flags) and read
 * by the site through /api/platform/status. Stored in Firestore at
 * `platform_config/site`, written only by the Admin SDK.
 *
 * A feature flag here hides a feature in the interface. It is not access
 * control: anything a flag turns off must not be the only thing protecting
 * data. That is the rules' job.
 */

export type BannerTone = "info" | "warning" | "critical";

export type PlatformConfig = {
  maintenance: {
    /** Shows the banner across the site. */
    enabled: boolean;
    message: string;
    tone: BannerTone;
  };
  flags: Record<FeatureFlag, boolean>;
  updatedAt: string | null;
  updatedBy: string | null;
};

/** How /console/flags groups the switches. */
export const FLAG_GROUPS = {
  pages: { title: "Pages", description: "Switched-off pages show a short notice and a link to search instead." },
  photos: {
    title: "Listing photo checks",
    description:
      "Checks every photo goes through in the listing wizard before upload. Turning one off lets those photos through for everyone, so switch it back on after testing. File type and the 10 MB limit are always enforced by storage.rules.",
  },
  accounts: { title: "Sign-in", description: "Ways to sign in on /auth/login." },
} as const;

export const FEATURE_FLAGS = {
  mapSearch: {
    group: "pages",
    label: "Map search",
    description: "The full-screen map at /map-search.",
  },
  aiSearch: {
    group: "pages",
    label: "AI search",
    description: "The AI Concierge search at /ai-search.",
  },
  photoAiCheck: {
    group: "photos",
    label: "Block AI-generated photos",
    description: "Turns down photos tagged as made or edited by an image generator.",
  },
  photoDuplicateCheck: {
    group: "photos",
    label: "Block duplicate photos",
    description: "Turns down a photo added twice to one listing, or already used on another listing.",
  },
  photoScreenshotCheck: {
    group: "photos",
    label: "Block screenshots",
    description: "Turns down screenshots of other apps and websites.",
  },
  photoBlurCheck: {
    group: "photos",
    label: "Block blurry photos",
    description: "Turns down photos with nothing in focus.",
  },
  photoResolutionCheck: {
    group: "photos",
    label: "Block low-resolution photos",
    description: "Turns down photos smaller than 1024 × 640 pixels.",
  },
  phoneSignIn: {
    group: "accounts",
    label: "Phone sign-in",
    description: "Signing in with an SMS code. Each real SMS is billed on the Blaze plan; test numbers are free.",
  },
} as const satisfies Record<string, { group: keyof typeof FLAG_GROUPS; label: string; description: string }>;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  maintenance: { enabled: false, message: "", tone: "info" },
  flags: {
    mapSearch: true,
    aiSearch: true,
    photoAiCheck: true,
    photoDuplicateCheck: true,
    photoScreenshotCheck: true,
    photoBlurCheck: true,
    photoResolutionCheck: true,
    phoneSignIn: true,
  },
  updatedAt: null,
  updatedBy: null,
};

/** Merges a stored document over the defaults, ignoring unknown or mistyped keys. */
export function normalisePlatformConfig(raw: unknown): PlatformConfig {
  const data = (raw ?? {}) as Partial<PlatformConfig> & Record<string, unknown>;
  const maintenance = (data.maintenance ?? {}) as Partial<PlatformConfig["maintenance"]>;
  const flags = { ...DEFAULT_PLATFORM_CONFIG.flags };
  for (const key of Object.keys(FEATURE_FLAGS) as FeatureFlag[]) {
    const value = (data.flags as Record<string, unknown> | undefined)?.[key];
    if (typeof value === "boolean") flags[key] = value;
  }
  const tone = maintenance.tone;
  return {
    maintenance: {
      enabled: maintenance.enabled === true,
      message: typeof maintenance.message === "string" ? maintenance.message.slice(0, 280) : "",
      tone: tone === "warning" || tone === "critical" ? tone : "info",
    },
    flags,
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : null,
    updatedBy: typeof data.updatedBy === "string" ? data.updatedBy : null,
  };
}
