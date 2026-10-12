import { fallbackProperties, type PropertyRecord } from "./property-data";

export type ParsedSearchIntent = {
  rawQuery: string;
  intent?: "rent" | "buy";
  targetLocation?: string;
  maxPriceZAR?: number;
  minPriceZAR?: number;
  minBedrooms?: number;
  minBathrooms?: number;
  minParking?: number;
  requiredAmenities: string[];
  propertyType?: string;
  furnishedStatus?: string;
};

export type GroundedRecommendation = {
  property: PropertyRecord;
  matchScore: number;
  matchReasons: string[];
  unmetCriteria: string[];
};

export function parseNaturalLanguageQuery(query: string): ParsedSearchIntent {
  const lower = query.toLowerCase();
  const intent: ParsedSearchIntent = {
    rawQuery: query,
    requiredAmenities: [],
  };

  // 1. Intent heuristics (Rent vs Buy)
  if (
    lower.includes("rent") ||
    lower.includes("to rent") ||
    lower.includes("rental") ||
    lower.includes("/mo") ||
    lower.includes("/month") ||
    lower.includes("per month")
  ) {
    intent.intent = "rent";
  } else if (
    lower.includes("buy") ||
    lower.includes("purchase") ||
    lower.includes("for sale") ||
    lower.includes("to buy")
  ) {
    intent.intent = "buy";
  }

  // 2. South African Location heuristics
  const locationsMap: Record<string, string> = {
    waterkloof: "Pretoria",
    menlyn: "Pretoria",
    pretoria: "Pretoria",
    centurion: "Centurion",
    sandton: "Sandton",
    rosebank: "Rosebank",
    bryanston: "Bryanston",
    waterfall: "Waterfall City",
    midrand: "Midrand",
    johannesburg: "Johannesburg",
    joburg: "Johannesburg",
    "camps bay": "Camps Bay",
    constantia: "Constantia",
    "century city": "Century City",
    stellenbosch: "Stellenbosch",
    "sea point": "Sea Point",
    "cape town": "Cape Town",
    umhlanga: "Umhlanga",
    ballito: "Ballito",
    durban: "Durban",
    gauteng: "Gauteng",
    "western cape": "Western Cape",
    "kwazulu-natal": "KwaZulu-Natal",
  };

  for (const [key, val] of Object.entries(locationsMap)) {
    if (lower.includes(key)) {
      intent.targetLocation = val;
      break;
    }
  }

  // 3. Price heuristics
  // Million check (e.g. under R7M, 6.5 million, R5m)
  const millionMatch = lower.match(
    /(?:below|under|max|up to)?\s*(?:r|zar)?\s*(\d+(?:\.\d+)?)\s*(?:m|mil|million)/i
  );
  if (millionMatch) {
    intent.maxPriceZAR = parseFloat(millionMatch[1]) * 1_000_000;
  } else {
    // Thousand / Rental check (e.g. under R20k, under R25,000, R15k/mo, 18000/month)
    const thousandKMatch = lower.match(
      /(?:below|under|max|up to)?\s*(?:r|zar)?\s*(\d+)\s*k(?:\/mo|\/month)?/i
    );
    if (thousandKMatch) {
      intent.maxPriceZAR = parseInt(thousandKMatch[1], 10) * 1_000;
      if (!intent.intent && intent.maxPriceZAR <= 150000) {
        intent.intent = "rent";
      }
    } else {
      const fullPriceMatch = lower.match(
        /(?:below|under|max|up to)?\s*(?:r|zar)?\s*(\d{1,3}(?:[,\s]\d{3})+|\d{4,9})/i
      );
      if (fullPriceMatch) {
        const cleanDigits = fullPriceMatch[1].replace(/[,\s]/g, "");
        const parsed = parseInt(cleanDigits, 10);
        if (parsed > 0) {
          intent.maxPriceZAR = parsed;
          if (!intent.intent && parsed <= 150000) {
            intent.intent = "rent";
          }
        }
      }
    }
  }

  // 4. Bedrooms
  const bedMatch = lower.match(/(\d+)\s*(?:bed|bedroom|br)/i);
  if (bedMatch) {
    intent.minBedrooms = parseInt(bedMatch[1], 10);
  }

  // 5. Bathrooms
  const bathMatch = lower.match(/(\d+)\s*(?:bath|bathroom|ba)/i);
  if (bathMatch) {
    intent.minBathrooms = parseInt(bathMatch[1], 10);
  }

  // 6. Garages / Parking
  const garageMatch = lower.match(/(\d+)\s*(?:garage|parking|car)/i);
  if (garageMatch) {
    intent.minParking = parseInt(garageMatch[1], 10);
  } else if (lower.includes("double garage")) {
    intent.minParking = 2;
  }

  // 7. Amenities & Lifestyle Features
  if (lower.includes("solar")) intent.requiredAmenities.push("solar_system");
  if (lower.includes("inverter") || lower.includes("battery") || lower.includes("load shedding")) {
    intent.requiredAmenities.push("inverter_battery");
  }
  if (lower.includes("borehole") || lower.includes("water tank")) {
    intent.requiredAmenities.push("borehole_water");
  }
  if (lower.includes("pool") || lower.includes("swimming")) {
    intent.requiredAmenities.push("swimming_pool");
  }
  if (lower.includes("garden") || lower.includes("yard")) {
    intent.requiredAmenities.push("garden");
  }
  if (lower.includes("security") || lower.includes("estate") || lower.includes("gated")) {
    intent.requiredAmenities.push("security_estate");
  }
  if (lower.includes("pet") || lower.includes("dog") || lower.includes("cat")) {
    intent.requiredAmenities.push("pet_friendly");
  }
  if (lower.includes("fibre") || lower.includes("fiber") || lower.includes("wifi")) {
    intent.requiredAmenities.push("fibre_ready");
  }
  if (lower.includes("braai") || lower.includes("patio")) {
    intent.requiredAmenities.push("braai_area");
  }

  // 8. Furnished Status
  if (lower.includes("unfurnished")) {
    intent.furnishedStatus = "Unfurnished";
  } else if (lower.includes("semi-furnished") || lower.includes("semi furnished")) {
    intent.furnishedStatus = "Semi-Furnished";
  } else if (lower.includes("furnished")) {
    intent.furnishedStatus = "Fully Furnished";
  }

  // 9. Property Type
  if (lower.includes("villa")) intent.propertyType = "Villa";
  else if (lower.includes("penthouse")) intent.propertyType = "Penthouse";
  else if (lower.includes("apartment") || lower.includes("flat") || lower.includes("loft")) {
    intent.propertyType = "Apartment";
  } else if (lower.includes("townhouse") || lower.includes("cluster")) {
    intent.propertyType = "Townhouse";
  } else if (lower.includes("estate home")) {
    intent.propertyType = "Estate Home";
  } else if (lower.includes("house")) {
    intent.propertyType = "House";
  } else if (lower.includes("land") || lower.includes("plot")) {
    intent.propertyType = "Land";
  }

  return intent;
}

export function generateGroundedRecommendations(intent: ParsedSearchIntent): GroundedRecommendation[] {
  return fallbackProperties
    .map((prop) => {
      let score = 70;
      const matchReasons: string[] = [];
      const unmetCriteria: string[] = [];

      if (intent.targetLocation && prop.location.toLowerCase().includes(intent.targetLocation.toLowerCase())) {
        score += 15;
        matchReasons.push(`Located in desired area (${intent.targetLocation})`);
      }

      if (intent.minBedrooms && prop.beds >= intent.minBedrooms) {
        score += 10;
        matchReasons.push(`Meets bedroom requirement (${prop.beds} beds)`);
      } else if (intent.minBedrooms) {
        unmetCriteria.push(`Fewer than ${intent.minBedrooms} bedrooms`);
      }

      if (intent.requiredAmenities.includes("solar_system")) {
        score += 5;
        matchReasons.push("Equipped with solar / backup power");
      }

      return {
        property: prop,
        matchScore: Math.min(score, 98),
        matchReasons,
        unmetCriteria,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}
