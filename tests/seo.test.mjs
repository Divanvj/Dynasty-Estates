import assert from "node:assert/strict";

// Test 1: Address Normalization
function normalizeAddress(rawAddress) {
  if (!rawAddress) return "";
  return rawAddress
    .toLowerCase()
    .replace(/[.,#\-/\\]/g, " ")
    .replace(/\bstreet\b/g, "st")
    .replace(/\broad\b/g, "rd")
    .replace(/\bavenue\b/g, "ave")
    .replace(/\bdrive\b/g, "dr")
    .replace(/\blane\b/g, "ln")
    .replace(/\bclose\b/g, "cl")
    .replace(/\bextension\b/g, "ext")
    .replace(/\s+/g, " ")
    .trim();
}

const raw1 = "14 Protea Lane, Waterkloof, Pretoria, Gauteng.";
const raw2 = "14 Protea Ln., Waterkloof, Pretoria - Gauteng";
assert.equal(normalizeAddress(raw1), "14 protea ln waterkloof pretoria gauteng");
assert.equal(normalizeAddress(raw1), normalizeAddress(raw2));
console.log("✓ Test 1 Passed: Address normalization standardizes abbreviations and punctuation");

// Test 2: Canonical URL Formation
function generateCanonicalUrl(baseUrl, type, slug) {
  return `${baseUrl.replace(/\/$/, "")}/${type}/${slug.toLowerCase().trim()}`;
}

const canonical = generateCanonicalUrl("https://dynastyestates.co.za/", "property", "waterkloof-crest");
assert.equal(canonical, "https://dynastyestates.co.za/property/waterkloof-crest");
console.log(`✓ Test 2 Passed: Canonical URL generated cleanly (${canonical})`);

// Test 3: Schema.org RealEstateListing Structure Integrity
function createMockStructuredData(property) {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description,
    url: `https://dynastyestates.co.za/property/${property.slug}`,
    offers: {
      "@type": "Offer",
      price: property.numericPrice,
      priceCurrency: "ZAR",
      availability: "https://schema.org/InStock",
      businessFunction: property.listingType === "rent" ? "http://purl.org/goodrelations/v1#LeaseOut" : "http://purl.org/goodrelations/v1#Sell",
    },
    contentLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: property.city,
        addressRegion: property.province,
        addressCountry: "ZA",
      },
    },
  };
}

const mockProp = {
  title: "Camps Bay Luxury Villa",
  slug: "camps-bay-luxury-villa",
  description: "Exquisite multi-level ocean view home.",
  numericPrice: 24000000,
  listingType: "sale",
  city: "Cape Town",
  province: "Western Cape",
};

const jsonLd = createMockStructuredData(mockProp);
assert.equal(jsonLd["@context"], "https://schema.org");
assert.equal(jsonLd["@type"], "RealEstateListing");
assert.equal(jsonLd.offers.priceCurrency, "ZAR");
assert.equal(jsonLd.offers.price, 24000000);
assert.equal(jsonLd.offers.businessFunction, "http://purl.org/goodrelations/v1#Sell");
assert.equal(jsonLd.contentLocation.address.addressCountry, "ZA");
console.log("✓ Test 3 Passed: Schema.org RealEstateListing JSON-LD structure verified");

// Test 4: Robots Disallow Rule Coverage
function checkRobotsDisallow(path, disallowedRules) {
  return disallowedRules.some((rule) => {
    if (rule.endsWith("/*")) {
      const prefix = rule.slice(0, -2);
      return path.startsWith(prefix);
    }
    return path.startsWith(rule);
  });
}

const disallowRules = ["/admin", "/agent", "/saved", "/api/"];
assert.ok(checkRobotsDisallow("/admin/dashboard", disallowRules));
assert.ok(checkRobotsDisallow("/api/progress", disallowRules));
assert.ok(!checkRobotsDisallow("/property/waterkloof-crest", disallowRules));
assert.ok(!checkRobotsDisallow("/for-sale/gauteng/pretoria", disallowRules));
console.log("✓ Test 4 Passed: Crawler controls correctly protect admin/api routes while permitting public indexable routes");

console.log("\nAll SEO unit tests executed successfully!");

