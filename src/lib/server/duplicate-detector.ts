import { GeoCoordinates, PhysicalProperty } from "@/lib/types/domain";
import { normalizeAddress } from "./property-service";

export type DuplicateConfidence = "HIGH" | "MEDIUM" | "LOW";

export interface DuplicateSignal {
  signalName: string;
  weight: number;
  score: number; // 0 to 1
  detail: string;
}

export interface DuplicateMatchResult {
  candidateId: string;
  matchedPropertyId: string;
  confidence: DuplicateConfidence;
  totalScore: number; // 0 to 100 percentage
  signals: DuplicateSignal[];
  recommendedAction: "AUTO_LINK" | "MANUAL_REVIEW" | "NO_ACTION";
}

/**
 * Calculates real-world distance between two lat/lng coordinates in meters
 * using the Haversine formula.
 */
export function haversineDistanceMeters(
  coord1: GeoCoordinates,
  coord2: GeoCoordinates
): number {
  const R = 6371e3; // Earth's radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const lat1Rad = toRad(coord1.latitude);
  const lat2Rad = toRad(coord2.latitude);
  const deltaLat = toRad(coord2.latitude - coord1.latitude);
  const deltaLng = toRad(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates string similarity between two strings using bigram dice coefficient (0 to 1)
 */
export function calculateStringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;

  const s1 = str1.toLowerCase().replace(/\s+/g, "");
  const s2 = str2.toLowerCase().replace(/\s+/g, "");

  if (s1 === s2) return 1;
  if (s1.length < 2 || s2.length < 2) return 0;

  const getBigrams = (s: string) => {
    const bigrams = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const bg = s.substring(i, i + 2);
      bigrams.set(bg, (bigrams.get(bg) || 0) + 1);
    }
    return bigrams;
  };

  const b1 = getBigrams(s1);
  const b2 = getBigrams(s2);

  let intersection = 0;
  for (const [bg, count] of b1.entries()) {
    if (b2.has(bg)) {
      intersection += Math.min(count, b2.get(bg)!);
    }
  }

  const total = (s1.length - 1) + (s2.length - 1);
  return (2 * intersection) / total;
}

/**
 * Evaluates duplicate probability between two physical properties
 */
export function comparePropertiesForDuplicate(
  propA: PhysicalProperty,
  propB: PhysicalProperty
): DuplicateMatchResult {
  const signals: DuplicateSignal[] = [];

  // Signal 1: Normalized Address Similarity (Weight: 35%)
  const normA = propA.normalizedAddress || normalizeAddress(`${propA.address.streetName} ${propA.address.suburb}`);
  const normB = propB.normalizedAddress || normalizeAddress(`${propB.address.streetName} ${propB.address.suburb}`);
  const addressSim = calculateStringSimilarity(normA, normB);
  signals.push({
    signalName: "Address Similarity",
    weight: 0.35,
    score: addressSim,
    detail: `Address match score: ${(addressSim * 100).toFixed(1)}% ("${normA}" vs "${normB}")`,
  });

  // Signal 2: Geographic Proximity (Weight: 25%)
  const distanceMeters = haversineDistanceMeters(propA.coordinates, propB.coordinates);
  let geoScore = 0;
  if (distanceMeters < 30) {
    geoScore = 1.0;
  } else if (distanceMeters < 100) {
    geoScore = 0.8;
  } else if (distanceMeters < 300) {
    geoScore = 0.4;
  } else if (distanceMeters < 600) {
    geoScore = 0.1;
  }
  signals.push({
    signalName: "Geographic Proximity",
    weight: 0.25,
    score: geoScore,
    detail: `Spatial distance: ${distanceMeters.toFixed(1)} meters`,
  });

  // Signal 3: Architectural Characteristics (Weight: 25%)
  let charScore = 0;
  let charMatches = 0;
  let totalChars = 4;

  if (propA.bedrooms === propB.bedrooms) charMatches++;
  if (Math.abs(propA.bathrooms - propB.bathrooms) <= 0.5) charMatches++;
  if (propA.propertyType === propB.propertyType) charMatches++;

  // Floor area within 5%
  if (propA.floorAreaSqm && propB.floorAreaSqm) {
    const areaDiff = Math.abs(propA.floorAreaSqm - propB.floorAreaSqm) / Math.max(propA.floorAreaSqm, propB.floorAreaSqm);
    if (areaDiff <= 0.05) {
      charMatches++;
    }
  } else {
    totalChars = 3;
  }

  charScore = charMatches / totalChars;
  signals.push({
    signalName: "Physical Characteristics",
    weight: 0.25,
    score: charScore,
    detail: `Matching specs: ${charMatches}/${totalChars} (Beds: ${propA.bedrooms} vs ${propB.bedrooms}, Baths: ${propA.bathrooms} vs ${propB.bathrooms})`,
  });

  // Signal 4: Suburb & City Match (Weight: 15%)
  const suburbMatch = propA.address.suburb.toLowerCase() === propB.address.suburb.toLowerCase();
  const cityMatch = propA.address.city.toLowerCase() === propB.address.city.toLowerCase();
  const locationScore = (suburbMatch ? 0.7 : 0) + (cityMatch ? 0.3 : 0);
  signals.push({
    signalName: "Suburb & Metro Integrity",
    weight: 0.15,
    score: locationScore,
    detail: `Suburb match: ${suburbMatch ? "YES" : "NO"}, City match: ${cityMatch ? "YES" : "NO"}`,
  });

  // Compute weighted composite score (0 to 100)
  const totalScore = Math.round(
    signals.reduce((acc, sig) => acc + sig.weight * sig.score, 0) * 100
  );

  let confidence: DuplicateConfidence = "LOW";
  let recommendedAction: "AUTO_LINK" | "MANUAL_REVIEW" | "NO_ACTION" = "NO_ACTION";

  if (totalScore >= 85) {
    confidence = "HIGH";
    recommendedAction = "AUTO_LINK"; // Same physical property advertised
  } else if (totalScore >= 60) {
    confidence = "MEDIUM";
    recommendedAction = "MANUAL_REVIEW"; // Send to admin moderation queue
  }

  return {
    candidateId: propA.id,
    matchedPropertyId: propB.id,
    confidence,
    totalScore,
    signals,
    recommendedAction,
  };
}

/**
 * Scans an existing catalog of physical properties to check if an incoming property is a duplicate
 */
export function findDuplicatesInCatalog(
  candidate: PhysicalProperty,
  catalog: PhysicalProperty[]
): DuplicateMatchResult[] {
  const matches: DuplicateMatchResult[] = [];

  for (const existing of catalog) {
    if (existing.id === candidate.id) continue;
    const result = comparePropertiesForDuplicate(candidate, existing);
    if (result.confidence !== "LOW") {
      matches.push(result);
    }
  }

  return matches.sort((a, b) => b.totalScore - a.totalScore);
}

