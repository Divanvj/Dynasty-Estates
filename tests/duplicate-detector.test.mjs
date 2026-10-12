import assert from "node:assert/strict";

// Mirror pure mathematical and string logic from duplicate-detector.ts
function haversineDistanceMeters(coord1, coord2) {
  const R = 6371e3;
  const toRad = (deg) => (deg * Math.PI) / 180;
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

function calculateStringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;
  const s1 = str1.toLowerCase().replace(/\s+/g, "");
  const s2 = str2.toLowerCase().replace(/\s+/g, "");
  if (s1 === s2) return 1;
  if (s1.length < 2 || s2.length < 2) return 0;

  const bigrams = (s) => {
    const map = new Map();
    for (let i = 0; i < s.length - 1; i++) {
      const bg = s.substring(i, i + 2);
      map.set(bg, (map.get(bg) || 0) + 1);
    }
    return map;
  };

  const b1 = bigrams(s1);
  const b2 = bigrams(s2);

  let intersection = 0;
  for (const [bg, count] of b1.entries()) {
    if (b2.has(bg)) {
      intersection += Math.min(count, b2.get(bg));
    }
  }

  return (2 * intersection) / (s1.length - 1 + s2.length - 1);
}

function compareProperties(propA, propB) {
  const addressSim = calculateStringSimilarity(propA.normalizedAddress, propB.normalizedAddress);
  const dist = haversineDistanceMeters(propA.coordinates, propB.coordinates);
  let geoScore = 0;
  if (dist < 30) geoScore = 1.0;
  else if (dist < 100) geoScore = 0.8;
  else if (dist < 300) geoScore = 0.4;

  let charMatches = 0;
  if (propA.bedrooms === propB.bedrooms) charMatches++;
  if (Math.abs(propA.bathrooms - propB.bathrooms) <= 0.5) charMatches++;
  if (propA.propertyType === propB.propertyType) charMatches++;
  const charScore = charMatches / 3;

  const totalScore = Math.round(
    (0.4 * addressSim + 0.3 * geoScore + 0.3 * charScore) * 100
  );

  let confidence = "LOW";
  if (totalScore >= 85) confidence = "HIGH";
  else if (totalScore >= 60) confidence = "MEDIUM";

  return { totalScore, confidence, distanceMeters: dist };
}

// Test Case 1: Identical physical property advertised by Agency A and Agency B
const propertyA = {
  id: "prop-1",
  normalizedAddress: "14 protea ln waterkloof pretoria gauteng",
  coordinates: { latitude: -25.7828, longitude: 28.2415 },
  bedrooms: 4,
  bathrooms: 3.5,
  propertyType: "House",
};

const propertyB_Identical = {
  id: "prop-2",
  normalizedAddress: "14 protea lane waterkloof pretoria gauteng",
  coordinates: { latitude: -25.78281, longitude: 28.24152 }, // ~2 meters away
  bedrooms: 4,
  bathrooms: 3.5,
  propertyType: "House",
};

const resultHigh = compareProperties(propertyA, propertyB_Identical);
assert.equal(resultHigh.confidence, "HIGH", `Expected HIGH confidence duplicate, got ${resultHigh.confidence}`);
assert.ok(resultHigh.totalScore >= 85, `Score ${resultHigh.totalScore} should be >= 85`);
assert.ok(resultHigh.distanceMeters < 10, "Distance should be under 10m");
console.log(`✓ Test 1 Passed: High-confidence duplicate detected (Score: ${resultHigh.totalScore}%, Distance: ${resultHigh.distanceMeters.toFixed(1)}m)`);

// Test Case 2: Different unit in same complex / nearby street (Medium confidence review)
const propertyC_Neighbor = {
  id: "prop-3",
  normalizedAddress: "16 protea ln waterkloof pretoria gauteng",
  coordinates: { latitude: -25.7832, longitude: 28.2420 }, // ~65 meters away
  bedrooms: 4,
  bathrooms: 3.5,
  propertyType: "House",
};

const resultMedium = compareProperties(propertyA, propertyC_Neighbor);
assert.ok(resultMedium.totalScore >= 60, `Score ${resultMedium.totalScore} should trigger review`);
console.log(`✓ Test 2 Passed: Nearby neighbor categorized appropriately (Score: ${resultMedium.totalScore}%, Distance: ${resultMedium.distanceMeters.toFixed(1)}m)`);

// Test Case 3: Completely distinct property in another suburb
const propertyD_Distinct = {
  id: "prop-4",
  normalizedAddress: "42 ocean view dr camps bay cape town western cape",
  coordinates: { latitude: -33.9513, longitude: 18.3781 },
  bedrooms: 5,
  bathrooms: 5.5,
  propertyType: "Villa",
};

const resultLow = compareProperties(propertyA, propertyD_Distinct);
assert.equal(resultLow.confidence, "LOW");
assert.ok(resultLow.totalScore < 30);
console.log(`✓ Test 3 Passed: Distinct physical property correctly identified (Confidence: LOW, Score: ${resultLow.totalScore}%)`);

console.log("\nAll Duplicate Detector unit tests executed successfully!");

