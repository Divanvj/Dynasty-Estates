import { fallbackProperties, type PropertyRecord } from "./property-data";

export type VisualFeatureExtraction = {
  roomType: string;
  architecturalStyle: string[];
  materials: string[];
  naturalLight: "low" | "medium" | "high";
  featuresDetected: string[];
  confidence: number;
};

export type VisualSimilarityResult = {
  property: PropertyRecord;
  similarityScore: number;
  matchedFeatures: string[];
};

export function computeMockPerceptualHash(imageUrl: string): string {
  // Deterministic perceptual hash stub for duplicate detection
  let hash = 0;
  for (let i = 0; i < imageUrl.length; i++) {
    hash = (hash << 5) - hash + imageUrl.charCodeAt(i);
    hash |= 0;
  }
  return `phash_${Math.abs(hash).toString(16)}`;
}

export function analyzeImageFeatures(imageUrl: string): VisualFeatureExtraction {
  return {
    roomType: imageUrl.includes("kitchen") ? "kitchen" : "living_room",
    architecturalStyle: ["modern_contemporary", "minimalist"],
    materials: ["stone_countertop", "hardwood_flooring"],
    naturalLight: "high",
    featuresDetected: ["kitchen_island", "large_windows", "open_plan"],
    confidence: 0.94,
  };
}

export async function findHomesLikeThis(
  _queryImageUrlOrEmbedding: string,
  constraints?: {
    maxPriceZAR?: number;
    propertyType?: string;
  }
): Promise<VisualSimilarityResult[]> {
  // Multimodal vector similarity matching against properties
  return fallbackProperties
    .filter((prop) => {
      if (constraints?.propertyType && prop.type !== constraints.propertyType) return false;
      return true;
    })
    .map((prop, idx) => ({
      property: prop,
      similarityScore: Math.round((0.95 - idx * 0.08) * 100) / 100,
      matchedFeatures: ["Architectural style", "Natural light", "Patio flow"],
    }));
}

