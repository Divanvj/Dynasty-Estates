import assert from "node:assert/strict";

// Test 1: Listing Quality Score Logic
function calculateListingQualityScore(data) {
  let score = 0;
  if (data.title && data.title.length > 8) score += 15;
  if (data.location && data.location.length > 4) score += 15;
  if (data.price) score += 15;
  if (data.beds && data.baths) score += 10;
  if (data.description && data.description.length > 60) score += 20;
  if (data.image && data.image.startsWith("http")) score += 15;
  if (data.features && data.features.length >= 3) score += 10;
  return Math.min(score, 100);
}

const completeListing = {
  title: "Modern Waterkloof Family Estate with Solar",
  location: "Waterkloof, Pretoria, Gauteng",
  price: "R 4,850,000",
  beds: 4,
  baths: 3.5,
  description: "A sensational multi-level architectural masterpiece in an exclusive 24h security estate featuring 8kW solar system, swimming pool, and private garden.",
  image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
  features: ["solar_system", "security_estate", "swimming_pool"],
};

const score = calculateListingQualityScore(completeListing);
assert.equal(score, 100, "Expected complete listing to achieve a 100 Quality Score");
console.log("✓ Test 1 Passed: Listing Quality Score calculates 100% correctly");

// Test 2: Natural Language Query Parsing
function parseQuery(query) {
  const lower = query.toLowerCase();
  const intent = { amenities: [] };
  if (lower.includes("pretoria")) intent.location = "Pretoria";
  if (lower.includes("solar")) intent.amenities.push("solar_system");
  const bedMatch = lower.match(/(\d+)\s*(?:bed|bedroom)/i);
  if (bedMatch) intent.bedrooms = parseInt(bedMatch[1], 10);
  return intent;
}

const parsed = parseQuery("Looking for a 4 bedroom house in Pretoria with solar");
assert.equal(parsed.location, "Pretoria");
assert.equal(parsed.bedrooms, 4);
assert.ok(parsed.amenities.includes("solar_system"));
console.log("✓ Test 2 Passed: Natural language search intent extracted correctly");

// Test 3: Financial Monthly Bond Repayment
function calculateMonthlyBondRepayment(principalZAR, annualInterestRate = 0.1175, tenureYears = 20) {
  const monthlyRate = annualInterestRate / 12;
  const numMonths = tenureYears * 12;
  return Math.round(
    (principalZAR * (monthlyRate * Math.pow(1 + monthlyRate, numMonths))) /
      (Math.pow(1 + monthlyRate, numMonths) - 1)
  );
}

const bondRepayment = calculateMonthlyBondRepayment(4_000_000, 0.1175, 20);
assert.ok(bondRepayment > 40000 && bondRepayment < 50000, `Bond repayment ${bondRepayment} should be ~R43,300/mo`);
console.log(`✓ Test 3 Passed: Bond repayment calculation verified (R ${bondRepayment}/mo on R4M)`);

console.log("\nAll automated domain tests executed successfully!");

