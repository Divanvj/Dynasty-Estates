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

export const FEATURE_FLAGS = {
  mapSearch: {
    label: "Map search",
    description: "The full-screen map at /map-search.",
  },
  aiSearch: {
    label: "AI search",
    description: "The AI Concierge search at /ai-search.",
  },
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  maintenance: { enabled: false, message: "", tone: "info" },
  flags: { mapSearch: true, aiSearch: true },
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
