import { collection, getDocs, query, where } from "firebase/firestore";

import { db, isFirebaseConfigured } from "./firebase";
import { ACTIVE_CATALOGUE_STATUSES } from "./types/domain";
export * from "./types/domain";

export type PropertyType =
  | "House"
  | "Villa"
  | "Apartment"
  | "Penthouse"
  | "Estate Home"
  | "Townhouse";

export type ListingType = "sale" | "rent";

export type PropertyRecord = {
  id: string;
  slug: string;
  title: string;
  location: string;
  suburb?: string;
  city?: string;
  province?: string;
  price: string;
  numericPrice: number;
  type: PropertyType;
  listingType?: ListingType;
  leaseTerm?: string;
  depositRequired?: number;
  furnishedStatus?: "Unfurnished" | "Semi-Furnished" | "Fully Furnished";
  beds: number;
  baths: number;
  tag: string;
  image: string;
  category: string;
  description: string;
  area: string;
  erfSize?: string;
  parking: number;
  rating: number;
  status: string;
  gallery: string[];
  features: string[];
  onShow?: {
    date: string;
    time: string;
    directionsNote?: string;
  };
  isDevelopment?: boolean;
  developmentInfo?: {
    developerName: string;
    phase: string;
    estimatedCompletion: string;
    unitsAvailable: number;
    noTransferDuty: boolean;
  };
  floorPlanImage?: string;
  virtualTourUrl?: string;
  ratesAndTaxes?: number;
  levies?: number;
};

export const southAfricanProvinces = [
  "All Provinces",
  "Gauteng",
  "Western Cape",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Free State",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
];

export const southAfricanCitiesByProvince: Record<string, string[]> = {
  "Eastern Cape": [
    "Bathurst",
    "Bhisho",
    "Cradock",
    "East London",
    "Gqeberha (Port Elizabeth)",
    "Graaff-Reinet",
    "Grahamstown (Makhanda)",
    "Jeffreys Bay",
    "Kenton-on-Sea",
    "Port Alfred",
    "Queenstown (Komani)",
    "St Francis Bay",
    "Summerstrand",
    "Uitenhage (Kariega)",
  ],
  "Free State": [
    "Bethlehem",
    "Bloemfontein",
    "Clarens",
    "Ficksburg",
    "Harrismith",
    "Kroonstad",
    "Parys",
    "Phuthaditjhaba",
    "Sasolburg",
    "Welkom",
    "Woodland Hills",
  ],
  Gauteng: [
    "Alberton",
    "Bedfordview",
    "Benoni",
    "Boksburg",
    "Brakpan",
    "Bryanston",
    "Centurion",
    "Dainfern",
    "Fourways",
    "Germiston",
    "Heidelberg",
    "Johannesburg",
    "Kempton Park",
    "Krugersdorp",
    "Menlyn Maine",
    "Midrand",
    "Morningside",
    "Pretoria",
    "Randburg",
    "Roodepoort",
    "Rosebank",
    "Sandton",
    "Silver Lakes",
    "Soweto",
    "Springs",
    "Vanderbijlpark",
    "Vereeniging",
    "Waterfall City",
    "Waterkloof",
  ],
  "KwaZulu-Natal": [
    "Amanzimtoti",
    "Ballito",
    "Dolphin Coast",
    "Drakensberg",
    "Dundee",
    "Durban",
    "Empangeni",
    "Hillcrest",
    "Howick",
    "Kloof",
    "Kokstad",
    "Ladysmith",
    "Margate",
    "Newcastle",
    "Pietermaritzburg",
    "Pinetown",
    "Port Shepstone",
    "Richards Bay",
    "Salt Rock",
    "Umhlanga",
    "Vryheid",
  ],
  Limpopo: [
    "Bela-Bela (Warmbaths)",
    "Giyani",
    "Hoedspruit",
    "Lephalale (Ellisras)",
    "Louis Trichardt (Makhado)",
    "Mokopane (Potgietersrus)",
    "Musina",
    "Phalaborwa",
    "Polokwane (Pietersburg)",
    "Thabazimbi",
    "Tzaneen",
  ],
  Mpumalanga: [
    "Barberton",
    "Dullstroom",
    "eMalahleni (Witbank)",
    "Graskop",
    "Hazyview",
    "Lydenburg (Mashishing)",
    "Malelane",
    "Mbombela (Nelspruit)",
    "Middelburg",
    "Sabie",
    "Secunda",
    "Standerton",
    "White River",
  ],
  "North West": [
    "Brits",
    "Hartbeespoort",
    "Klerksdorp",
    "Lichtenburg",
    "Mahikeng (Mafikeng)",
    "Orkney",
    "Potchefstroom",
    "Rustenburg",
    "Schweizer-Reneke",
    "Sun City",
    "Vryburg",
    "Zeerust",
  ],
  "Northern Cape": [
    "Calvinia",
    "Colesberg",
    "De Aar",
    "Douglas",
    "Kakamas",
    "Kathu",
    "Kimberley",
    "Kuruman",
    "Port Nolloth",
    "Springbok",
    "Upington",
  ],
  "Western Cape": [
    "Camps Bay",
    "Cape Town",
    "Century City",
    "Ceres",
    "Claremont",
    "Constantia",
    "Franschhoek",
    "George",
    "Hermanus",
    "Knysna",
    "Langebaan",
    "Mossel Bay",
    "Oudtshoorn",
    "Paarl",
    "Plettenberg Bay",
    "Robertson",
    "Saldanha",
    "Sea Point",
    "Somerset West",
    "Stellenbosch",
    "Swellendam",
    "Worcester",
  ],
};

export function matchProvinceName(input: string): string | null {
  if (!input || !input.trim()) return null;
  const clean = input.trim().toLowerCase();
  if (clean === "all" || clean === "all provinces") return null;

  const aliases: Record<string, string> = {
    gp: "Gauteng",
    gauteng: "Gauteng",
    wc: "Western Cape",
    "western cape": "Western Cape",
    "western-cape": "Western Cape",
    kzn: "KwaZulu-Natal",
    "kwazulu-natal": "KwaZulu-Natal",
    "kwazulu natal": "KwaZulu-Natal",
    natal: "KwaZulu-Natal",
    ec: "Eastern Cape",
    "eastern cape": "Eastern Cape",
    "eastern-cape": "Eastern Cape",
    fs: "Free State",
    "free state": "Free State",
    "free-state": "Free State",
    freestate: "Free State",
    lp: "Limpopo",
    limpopo: "Limpopo",
    mp: "Mpumalanga",
    mpumalanga: "Mpumalanga",
    nw: "North West",
    "north west": "North West",
    "north-west": "North West",
    northwest: "North West",
    nc: "Northern Cape",
    "northern cape": "Northern Cape",
    "northern-cape": "Northern Cape",
  };

  if (aliases[clean]) return aliases[clean];

  const standardProvinces = [
    "Gauteng",
    "Western Cape",
    "KwaZulu-Natal",
    "Eastern Cape",
    "Free State",
    "Limpopo",
    "Mpumalanga",
    "North West",
    "Northern Cape",
  ];

  const found = standardProvinces.find(
    (p) => p.toLowerCase() === clean || p.toLowerCase().startsWith(clean) || clean.startsWith(p.toLowerCase())
  );

  return found ?? null;
}

export function getCitiesForProvince(provinceInput: string): string[] {
  const matched = matchProvinceName(provinceInput);
  if (matched && southAfricanCitiesByProvince[matched]) {
    return [...southAfricanCitiesByProvince[matched]].sort((a, b) => a.localeCompare(b));
  }

  // Fallback: If no province is matched or provided, return all major cities in alphabetical order
  const allCities = new Set<string>();
  Object.values(southAfricanCitiesByProvince).forEach((cities) => {
    cities.forEach((c) => allCities.add(c));
  });
  return Array.from(allCities).sort((a, b) => a.localeCompare(b));
}

export const amenityTaxonomy = [
  { id: "solar_system", label: "Solar PV System" },
  { id: "inverter_battery", label: "Inverter & Battery Backup" },
  { id: "security_estate", label: "24h Guarded Security Estate" },
  { id: "braai_area", label: "Built-in Braai & Entertainment Patio" },
  { id: "swimming_pool", label: "Swimming Pool" },
  { id: "borehole", label: "Borehole & Filtration" },
  { id: "water_tanks", label: "JoJo Water Backup Tanks" },
  { id: "garden", label: "Landscaped Garden" },
  { id: "pet_friendly", label: "Pet Friendly" },
  { id: "fibre_ready", label: "High-Speed Fibre Ready" },
  { id: "staff_quarters", label: "Domestic Staff Quarters (SQ)" },
  { id: "flatlet", label: "Separate Self-Contained Flatlet" },
];

// This list used to be a mix of lifecycle statuses and marketing labels ("Live",
// "Featured", "Open house"). Those labels are `tag` values, never statuses, and
// asking Firestore for statuses the rules did not permit got the whole query
// denied. It now comes from the one canonical list, which firestore.rules mirrors.
const publicStatuses: readonly string[] = ACTIVE_CATALOGUE_STATUSES;

/**
 * The marketing tag to show beside a listing's transaction badge, or null when
 * there is nothing worth showing.
 *
 * A card already states "To Rent" or "For Sale"; a tag repeating it renders the
 * same words twice. That happens because `tag` and `status` were conflated for a
 * long time, so plenty of records carry a tag that is really a transaction
 * label. Guarding at the display layer means it stays fixed regardless of what
 * any individual record holds.
 */
export function getDisplayTag(property: Pick<PropertyRecord, "tag" | "listingType">): string | null {
  const tag = property.tag?.trim();
  if (!tag) return null;
  const transactionLabel = property.listingType === "rent" ? "to rent" : "for sale";
  return tag.toLowerCase() === transactionLabel ? null : tag;
}

export const fallbackProperties: PropertyRecord[] = [
  {
    id: "rosebank-vantage",
    slug: "rosebank-vantage",
    title: "The Vantage Executive Loft",
    location: "Bath Avenue, Rosebank, Johannesburg, Gauteng",
    suburb: "Rosebank",
    city: "Johannesburg",
    province: "Gauteng",
    price: "R 13,500 / month",
    numericPrice: 13500,
    type: "Apartment",
    listingType: "rent",
    leaseTerm: "12 Months",
    depositRequired: 20250,
    furnishedStatus: "Fully Furnished",
    beds: 1,
    baths: 1,
    tag: "To Rent",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
    category: "Rosebank Gautrain Precinct",
    description:
      "Chic, north-facing executive suite located just 250m from Rosebank Gautrain station, Rosebank Mall, and The Zone. Features Caesarstone kitchen with integrated Smeg appliances, prepaid electricity, full generator backup power for seamless load-shedding resilience, high-speed fibre internet, 24-hour concierge, biometric access control, and 1 secure basement bay.",
    area: "55 m²",
    parking: 1,
    rating: 4.8,
    status: "Published",
    gallery: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    ],
    features: ["inverter_battery", "security_estate", "fibre_ready"],
    onShow: {
      date: "Sunday, 14 Sep",
      time: "14:00 – 17:00",
      directionsNote: "Follow Dynasty Estates pointer boards from Oxford Road into Bath Avenue",
    },
    floorPlanImage: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80",
    virtualTourUrl: "https://my.matterport.com/show/?m=sample-matterport-tour",
    ratesAndTaxes: 1250,
    levies: 2100,
  },
  {
    id: "stellenbosch-cottage",
    slug: "stellenbosch-cottage",
    title: "Brandwacht Winelands Garden Cottage",
    location: "Brandwacht, Stellenbosch, Western Cape",
    suburb: "Stellenbosch",
    city: "Stellenbosch",
    province: "Western Cape",
    price: "R 16,500 / month",
    numericPrice: 16500,
    type: "House",
    listingType: "rent",
    leaseTerm: "12 Months",
    depositRequired: 24750,
    furnishedStatus: "Semi-Furnished",
    beds: 2,
    baths: 2,
    tag: "To Rent",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
    category: "Cape Winelands Lifestyle",
    description:
      "Charming Cape Dutch-styled cottage nestled under mature oak trees in prestigious Brandwacht, Stellenbosch. Offers private pet-friendly garden, covered entertainment veranda with built-in braai, 5kW Deye inverter system with lithium battery backup, high-speed fibre, and automated driveway gate. Walking distance to Paul Roos Gymnasium, Bloemhof, and Stellenbosch University.",
    area: "140 m²",
    erfSize: "680 m²",
    parking: 2,
    rating: 4.8,
    status: "Published",
    gallery: [
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    ],
    features: ["solar_system", "inverter_battery", "garden", "pet_friendly", "fibre_ready", "braai_area"],
    onShow: {
      date: "Sunday, 14 Sep",
      time: "14:00 – 17:00",
      directionsNote: "Follow boards along R44 into Brandwacht avenue",
    },
    floorPlanImage: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80",
    ratesAndTaxes: 1450,
  },
  {
    id: "sandton-skye",
    slug: "sandton-skye",
    title: "Sandton Skye Executive High-Rise",
    location: "Stan Road, Sandton Central, Johannesburg, Gauteng",
    suburb: "Sandton",
    city: "Sandton",
    province: "Gauteng",
    price: "R 17,500 / month",
    numericPrice: 17500,
    type: "Apartment",
    listingType: "rent",
    leaseTerm: "12 Months",
    depositRequired: 26250,
    furnishedStatus: "Fully Furnished",
    beds: 1,
    baths: 1,
    tag: "To Rent",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    category: "Financial District Luxury High-Rise",
    description:
      "Sophisticated designer studio suite on Stan Road in the heart of Sandton CBD. Boasts panoramic skyline views, full generator backup power so you are never affected by load-shedding, on-site gourmet restaurant, fitness gym, sparkling rim pool, 24-hour manned biometric security, front desk concierge, and basement parking. Minutes from Sandton City and Gautrain.",
    area: "65 m²",
    parking: 1,
    rating: 4.8,
    status: "Published",
    gallery: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
    ],
    features: ["inverter_battery", "security_estate", "swimming_pool", "fibre_ready"],
  },
  {
    id: "century-city-waterside",
    slug: "century-city-waterside",
    title: "Century City Canal Quays Apartment",
    location: "Park Lane, Century City, Cape Town, Western Cape",
    suburb: "Century City",
    city: "Cape Town",
    province: "Western Cape",
    price: "R 19,500 / month",
    numericPrice: 19500,
    type: "Apartment",
    listingType: "rent",
    leaseTerm: "12 Months",
    depositRequired: 29250,
    furnishedStatus: "Semi-Furnished",
    beds: 2,
    baths: 2,
    tag: "To Rent",
    image: "https://images.unsplash.com/photo-1515263487990-61b07816b324?auto=format&fit=crop&w=1200&q=80",
    category: "Waterfront Canal Lifestyle",
    description:
      "Bright corner apartment overlooking the tranquil Century City waterways. Features open-plan lounge opening onto a private balcony with water views, modern granite kitchen, 2 allocated basement parking bays, and prepaid utilities. Directly connected to the canal walkway leading to Canal Walk Shopping Centre, Intaka Island bird sanctuary, and Virgin Active.",
    area: "95 m²",
    parking: 2,
    rating: 4.8,
    status: "Published",
    gallery: [
      "https://images.unsplash.com/photo-1515263487990-61b07816b324?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
    ],
    features: ["inverter_battery", "fibre_ready", "security_estate", "swimming_pool"],
  },
  {
    id: "menlyn-maine",
    slug: "menlyn-maine",
    title: "The Trilogy at Menlyn Maine",
    location: "Aramist Avenue, Menlyn Maine, Pretoria, Gauteng",
    suburb: "Menlyn",
    city: "Pretoria",
    province: "Gauteng",
    price: "R 22,000 / month",
    numericPrice: 22000,
    type: "Apartment",
    listingType: "rent",
    leaseTerm: "12 Months",
    depositRequired: 33000,
    furnishedStatus: "Fully Furnished",
    beds: 2,
    baths: 2,
    tag: "To Rent",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
    category: "Green Star Urban Precinct Living",
    description:
      "Ultra-contemporary luxury living in Africa's premier Green Star certified city precinct. Features open-plan living with designer Italian kitchen, 100% solar and backup generator resilience, 2 secure basement bays, and access to the rooftop swimming pool, restaurant, and cocktail bar. Step outside directly into Menlyn Maine Central Square and SunBet Arena.",
    area: "110 m²",
    parking: 2,
    rating: 4.9,
    status: "Published",
    gallery: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    ],
    features: ["solar_system", "inverter_battery", "swimming_pool", "security_estate", "fibre_ready"],
  },
  {
    id: "ballito-breeze",
    slug: "ballito-breeze",
    title: "Seaward Estate Contemporary Townhouse",
    location: "Decagon Road, Seaward Estate, Ballito, KwaZulu-Natal",
    suburb: "Ballito",
    city: "Ballito",
    province: "KwaZulu-Natal",
    price: "R 24,000 / month",
    numericPrice: 24000,
    type: "Townhouse",
    listingType: "rent",
    leaseTerm: "12 Months",
    depositRequired: 36000,
    furnishedStatus: "Unfurnished",
    beds: 3,
    baths: 2.5,
    tag: "To Rent",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    category: "Dolphin Coast Family Townhouse",
    description:
      "Sleek, pet-friendly coastal townhouse in secure Seaward Estate, Ballito. Features open-concept living flowing onto an undercover patio with built-in stainless steel braai, private level garden, 5kW Sunsynk solar inverter system with lithium battery, automated double garage, and air-conditioning. Walking distance to Ashton International College and Ballito Junction.",
    area: "220 m²",
    parking: 2,
    rating: 4.7,
    status: "Published",
    gallery: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    ],
    features: ["solar_system", "inverter_battery", "garden", "pet_friendly", "security_estate", "braai_area"],
  },
  {
    id: "midrand-waterfall",
    slug: "midrand-waterfall",
    title: "Waterfall Country Village Cluster",
    location: "Country Gate, Waterfall City, Midrand, Gauteng",
    suburb: "Waterfall",
    city: "Midrand",
    province: "Gauteng",
    price: "R 29,500 / month",
    numericPrice: 29500,
    type: "Townhouse",
    listingType: "rent",
    leaseTerm: "12 or 24 Months",
    depositRequired: 44250,
    furnishedStatus: "Unfurnished",
    beds: 3,
    baths: 2.5,
    tag: "To Rent",
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80",
    category: "Waterfall Secure Lifestyle Cluster",
    description:
      "Modern freestanding cluster in prestigious Waterfall Country Village. Designed with seamless flow between the Caesarstone kitchen and family room opening to a covered braai patio and landscaped pet-friendly garden. Fitted with an 8kW solar inverter backup system, double automated garage with direct entry, and access to Waterfall's 37km of walking/bike trails, gym, and Reddam House.",
    area: "270 m²",
    parking: 2,
    rating: 4.9,
    status: "Published",
    gallery: [
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80",
    ],
    features: ["solar_system", "inverter_battery", "garden", "security_estate", "pet_friendly", "braai_area"],
  },
  {
    id: "umhlanga-pearl",
    slug: "umhlanga-pearl",
    title: "The Pearls of Umhlanga Sky Residence",
    location: "Lagoon Drive, Umhlanga Rocks, KwaZulu-Natal",
    suburb: "Umhlanga",
    city: "Durban",
    province: "KwaZulu-Natal",
    price: "R 38,000 / month",
    numericPrice: 38000,
    type: "Penthouse",
    listingType: "rent",
    leaseTerm: "12 Months",
    depositRequired: 57000,
    furnishedStatus: "Semi-Furnished",
    beds: 3,
    baths: 3.5,
    tag: "To Rent",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
    category: "Iconic Oceanfront Sky Residence",
    description:
      "Breathtaking frontline Indian Ocean apartment in the world-renowned Pearls of Umhlanga. Features expansive wraparound entertainment terrace with ocean vistas, ducted air-conditioning, gourmet kitchen with Miele appliances, full generator backup power, 2 secure undercover parking bays, 24-hour biometric security and concierge, and direct beach access to the Umhlanga Promenade.",
    area: "280 m²",
    parking: 2,
    rating: 4.9,
    status: "Published",
    gallery: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
    ],
    features: ["swimming_pool", "security_estate", "inverter_battery", "fibre_ready"],
  },
  {
    id: "harbor-view",
    slug: "harbor-view",
    title: "The Glen Luxury Coastal Villa",
    location: "The Glen, Camps Bay, Cape Town, Western Cape",
    suburb: "Camps Bay",
    city: "Cape Town",
    province: "Western Cape",
    price: "R 55,000 / month",
    numericPrice: 55000,
    type: "Villa",
    listingType: "rent",
    leaseTerm: "12 Months",
    depositRequired: 110000,
    furnishedStatus: "Fully Furnished",
    beds: 4,
    baths: 4.5,
    tag: "To Rent",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    category: "Atlantic Seaboard Executive Villa",
    description:
      "Spectacular multi-level architectural villa situated in a wind-sheltered pocket of The Glen, Camps Bay. Features panoramic views of the Twelve Apostles and Atlantic Ocean, heated rim-flow infinity pool, integrated open-plan Miele kitchen, 10kW solar system with 15kWh lithium battery storage, automated double garage plus secure guest bay, and advanced perimeter security with beams and armed response link.",
    area: "520 m²",
    parking: 3,
    rating: 4.9,
    status: "Featured",
    gallery: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    ],
    features: ["swimming_pool", "solar_system", "inverter_battery", "fibre_ready", "security_estate", "braai_area"],
  },
  {
    id: "constantia-manor",
    slug: "constantia-manor",
    title: "Constantia Upper Historic Manor",
    location: "Southern Cross Drive, Constantia Upper, Cape Town, Western Cape",
    suburb: "Constantia",
    city: "Cape Town",
    province: "Western Cape",
    price: "R 75,000 / month",
    numericPrice: 75000,
    type: "Estate Home",
    listingType: "rent",
    leaseTerm: "12 Months",
    depositRequired: 150000,
    furnishedStatus: "Fully Furnished",
    beds: 5,
    baths: 5,
    tag: "To Rent",
    image: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1200&q=80",
    category: "Historic Constantia Winelands Estate",
    description:
      "Gracious Constantia Upper estate framed by ancient oak trees, private vineyard rows, and Table Mountain National Park backdrops. Boasts full off-grid solar microgrid (15kW solar array + 20kWh battery storage), private borehole with reverse-osmosis filtration system, heated 15m lap pool, undercover braai veranda with pizza oven, wine cellar, self-contained flatlet, and double domestic staff quarters.",
    area: "680 m²",
    parking: 4,
    rating: 5.0,
    status: "Featured",
    gallery: [
      "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
    ],
    features: ["solar_system", "inverter_battery", "borehole", "swimming_pool", "garden", "flatlet", "pet_friendly", "staff_quarters", "water_tanks", "braai_area"],
  },
  {
    id: "oak-terrace",
    slug: "oak-terrace",
    title: "Claremont Upper Courtyard Townhouse",
    location: "Keurboom Road, Claremont Upper, Cape Town, Western Cape",
    suburb: "Claremont",
    city: "Cape Town",
    province: "Western Cape",
    price: "R 2,950,000",
    numericPrice: 2950000,
    type: "Townhouse",
    listingType: "sale",
    beds: 2,
    baths: 2,
    tag: "For Sale",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
    category: "Southern Suburbs School Belt",
    description:
      "Sought-after lock-up-and-go townhouse in Claremont Upper near Western Province CC and premier schools (Herschel, Grove, Westerford). Features north-facing private courtyard with built-in braai, 5kW Sunsynk inverter system with 5kWh lithium battery, double automated garage, fibre connectivity, and perimeter electric fencing with CCTV monitoring.",
    area: "145 m²",
    erfSize: "280 m²",
    parking: 2,
    rating: 4.8,
    status: "Published",
    gallery: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    ],
    features: ["inverter_battery", "security_estate", "braai_area", "garden", "pet_friendly", "fibre_ready"],
    onShow: {
      date: "Sunday, 14 Sep",
      time: "14:00 – 17:00",
      directionsNote: "Pointers from Palmyra Rd into Keurboom Rd",
    },
    floorPlanImage: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80",
    ratesAndTaxes: 1850,
    levies: 2400,
  },
  {
    id: "summerstrand-beachfront",
    slug: "summerstrand-beachfront",
    title: "Summerstrand Oceanfront Family Residence",
    location: "Marine Drive, Summerstrand, Gqeberha, Eastern Cape",
    suburb: "Summerstrand",
    city: "Gqeberha (Port Elizabeth)",
    province: "Eastern Cape",
    price: "R 3,650,000",
    numericPrice: 3650000,
    type: "House",
    listingType: "sale",
    beds: 4,
    baths: 3,
    tag: "For Sale",
    image: "https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=1200&q=80",
    category: "Eastern Cape Golden Mile",
    description:
      "Positioned directly opposite Pollok Beach along Gqeberha's prestigious beachfront promenade. Boasts an enclosed all-weather braai room overlooking a sun-splashed pool, 8kW solar PV array with 10kWh battery backup, 5,000L JoJo rainwater harvesting tank plumbed to the home, Nelson Mandela University vicinity, and comprehensive security.",
    area: "380 m²",
    parking: 2,
    rating: 4.7,
    status: "Published",
    gallery: [
      "https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    ],
    features: ["solar_system", "inverter_battery", "swimming_pool", "water_tanks", "braai_area", "garden", "fibre_ready", "pet_friendly"],
  },
  {
    id: "bloemfontein-woodland-hills",
    slug: "bloemfontein-woodland-hills",
    title: "Woodland Hills Wildlife Estate Villa",
    location: "Bergwind Drive, Woodland Hills Wildlife Estate, Bloemfontein, Free State",
    suburb: "Woodland Hills",
    city: "Bloemfontein",
    province: "Free State",
    price: "R 4,150,000",
    numericPrice: 4150000,
    type: "Estate Home",
    listingType: "sale",
    beds: 4,
    baths: 3.5,
    tag: "For Sale",
    image: "https://images.unsplash.com/photo-1598228723793-52759bba239c?auto=format&fit=crop&w=1200&q=80",
    category: "Free State Wildlife Eco-Estate",
    description:
      "Exceptional modern bushveld residence in Woodland Hills Wildlife Estate where roaming impala and kudu graze at your patio. Includes 8kW hybrid solar inverter setup, automated irrigation connected to estate greywater, spacious undercover braai patio with boma, double-volume living area, separate scullery, and 24/7 electrified perimeter with thermal camera surveillance.",
    area: "440 m²",
    parking: 3,
    rating: 4.8,
    status: "Published",
    gallery: [
      "https://images.unsplash.com/photo-1598228723793-52759bba239c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80",
    ],
    features: ["solar_system", "inverter_battery", "security_estate", "braai_area", "garden", "pet_friendly", "fibre_ready"],
  },
  {
    id: "juniper-ridge",
    slug: "juniper-ridge",
    title: "Mount Street Enclosure Family Homestead",
    location: "Mount Street Enclosure, Bryanston East, Sandton, Gauteng",
    suburb: "Bryanston",
    city: "Sandton",
    province: "Gauteng",
    price: "R 4,950,000",
    numericPrice: 4950000,
    type: "House",
    listingType: "sale",
    beds: 4,
    baths: 3.5,
    tag: "For Sale",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    category: "Sandton Secure Enclosure",
    description:
      "Nestled within the boomed Mount Street 24/7 security enclosure in Bryanston East. Features 8kW Sunsynk inverter system with dual lithium batteries, private borehole connected to automated garden irrigation, large entertainer's covered patio with gas/wood built-in braai, sparkling pool, domestic staff quarters (SQ), and quick access to St Stithians, Bryanston High, and Sandton CBD.",
    area: "460 m²",
    erfSize: "1,450 m²",
    parking: 3,
    rating: 4.9,
    status: "Published",
    gallery: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    ],
    features: ["solar_system", "inverter_battery", "borehole", "security_estate", "swimming_pool", "braai_area", "garden", "staff_quarters", "pet_friendly", "fibre_ready"],
    onShow: {
      date: "Sunday, 14 Sep",
      time: "14:00 – 17:00",
      directionsNote: "Access via Mount Street boomed gate from William Nicol Drive",
    },
    floorPlanImage: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80",
    virtualTourUrl: "https://my.matterport.com/show/?m=sample-matterport-tour",
    ratesAndTaxes: 2600,
  },
  {
    id: "silver-lakes",
    slug: "silver-lakes",
    title: "Silver Lakes Golf & Wildlife Fairway Haven",
    location: "Kingfisher Drive, Silver Lakes Golf Estate, Pretoria East, Gauteng",
    suburb: "Silver Lakes",
    city: "Pretoria",
    province: "Gauteng",
    price: "R 5,850,000",
    numericPrice: 5850000,
    type: "Estate Home",
    listingType: "sale",
    beds: 4,
    baths: 4,
    tag: "For Sale",
    image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
    category: "Pretoria East Signature Golf Estate",
    description:
      "Fronting onto the fairways in prestigious Silver Lakes Golf Estate. Features 10kW Deye solar system with 15kWh storage (100% off-grid capability), private borehole with water filtration system, solar-heated swimming pool, enclosed braai room with stackable glass doors, modern granite kitchen with walk-in pantry, separate laundry, and double staff accommodation.",
    area: "490 m²",
    erfSize: "980 m²",
    parking: 3,
    rating: 4.8,
    status: "Published",
    gallery: [
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
    ],
    features: ["solar_system", "inverter_battery", "borehole", "security_estate", "swimming_pool", "braai_area", "garden", "staff_quarters", "pet_friendly", "fibre_ready"],
    ratesAndTaxes: 2850,
    levies: 2600,
  },
  {
    id: "waterkloof-crest",
    slug: "waterkloof-crest",
    title: "Waterkloof Ridge Diplomatic Architectural Villa",
    location: "Rigel Avenue, Waterkloof Ridge, Pretoria, Gauteng",
    suburb: "Waterkloof",
    city: "Pretoria",
    province: "Gauteng",
    price: "R 6,950,000",
    numericPrice: 6950000,
    type: "Estate Home",
    listingType: "sale",
    isDevelopment: true,
    developmentInfo: {
      developerName: "Dynasty Developments SA",
      phase: "Phase 2 (Pre-Launch Release)",
      estimatedCompletion: "Q1 2027",
      unitsAvailable: 3,
      noTransferDuty: true,
    },
    beds: 5,
    baths: 4.5,
    tag: "Off-Plan Release",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
    category: "New Off-Plan Developments",
    description:
      "Architectural masterpiece elevated on Waterkloof Ridge offering sweeping northern panoramas and diplomatic-grade security. Brand new turnkey off-plan development with ZERO SARS transfer duty payable! Equipped with 12kW 3-phase solar inverter system, active borehole with 10,000L JoJo water tanks and purification, infinity lap pool, climate-controlled wine room, self-contained 1-bedroom flatlet, and 24/7 dedicated armed response enclosure.",
    area: "580 m²",
    erfSize: "1,200 m²",
    parking: 4,
    rating: 5.0,
    status: "Published",
    gallery: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    ],
    features: ["solar_system", "inverter_battery", "borehole", "water_tanks", "security_estate", "swimming_pool", "flatlet", "garden", "braai_area", "fibre_ready", "staff_quarters"],
    onShow: {
      date: "Sunday, 14 Sep",
      time: "14:00 – 17:00",
      directionsNote: "Follow Dynasty Estates flags along Rigel Ave, Waterkloof Ridge",
    },
    floorPlanImage: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80",
    virtualTourUrl: "https://my.matterport.com/show/?m=sample-matterport-tour",
    ratesAndTaxes: 3400,
  },
  {
    id: "simbithi-eco-estate",
    slug: "simbithi-eco-estate",
    title: "Simbithi Eco-Estate Ocean-Breeze Pavilion",
    location: "Jackalberry Way, Simbithi Eco-Estate, Ballito, KwaZulu-Natal",
    suburb: "Ballito",
    city: "Ballito",
    province: "KwaZulu-Natal",
    price: "R 7,650,000",
    numericPrice: 7650000,
    type: "Estate Home",
    listingType: "sale",
    beds: 4,
    baths: 4.5,
    tag: "For Sale",
    image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80",
    category: "North Coast Eco-Estate Luxury",
    description:
      "Tropical contemporary residence harmoniously set amidst Simbithi's indigenous coastal forests. Highlights include an 8kW solar inverter installation, 5,000L rainwater tank, seamless indoor-outdoor living onto an expansive wooden deck with rim-flow pool and sunken boma fire pit, Peter Matkovich golf course access, five community clubhouses, and elite biometric security.",
    area: "520 m²",
    parking: 3,
    rating: 4.9,
    status: "Published",
    gallery: [
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1200&q=80",
    ],
    features: ["solar_system", "inverter_battery", "water_tanks", "security_estate", "swimming_pool", "braai_area", "garden", "pet_friendly", "fibre_ready"],
  },
  {
    id: "crescent-villa",
    slug: "crescent-villa",
    title: "Morningside Sandhurst Border Grand Manor",
    location: "Summit Road, Morningside, Sandton, Gauteng",
    suburb: "Morningside",
    city: "Sandton",
    province: "Gauteng",
    price: "R 8,900,000",
    numericPrice: 8900000,
    type: "Villa",
    listingType: "sale",
    beds: 5,
    baths: 5.5,
    tag: "For Sale",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    category: "Sandton Elite Manor",
    description:
      "A private 2,500m² sanctuary along the Morningside-Sandhurst border. Features floodlit tennis court, heated swimming pool, 15kW solar installation with 20kWh lithium batteries, high-yield borehole with whole-house filtration, grand double-volume reception with marble flooring, custom braai pavilion with wood-fired pizza oven, 2-bedroom staff cottage, and CAP boomed enclosure.",
    area: "690 m²",
    parking: 4,
    rating: 5.0,
    status: "Published",
    gallery: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    ],
    features: ["solar_system", "inverter_battery", "borehole", "water_tanks", "security_estate", "swimming_pool", "braai_area", "garden", "staff_quarters", "flatlet", "pet_friendly", "fibre_ready"],
  },
  {
    id: "dainfern-golf-estate",
    slug: "dainfern-golf-estate",
    title: "Dainfern Golf Estate Riverfront Residence",
    location: "Cedar Lakes Link, Dainfern Golf Estate, Sandton, Gauteng",
    suburb: "Dainfern",
    city: "Sandton",
    province: "Gauteng",
    price: "R 9,850,000",
    numericPrice: 9850000,
    type: "Estate Home",
    listingType: "sale",
    beds: 5,
    baths: 5,
    tag: "For Sale",
    image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80",
    category: "Gary Player Signature Estate",
    description:
      "Prime riverfront frontage overlooking the Jukskei River and manicured fairways in Dainfern Golf Estate. Boasts 12kW Victron solar system, sparkling heated pool, expansive covered patio with gas braai and prep counter, separate self-contained guest suite/cottage, double staff quarters, and world-class estate lifestyle including clubhouse, squash courts, and nature trails.",
    area: "610 m²",
    parking: 4,
    rating: 4.9,
    status: "Published",
    gallery: [
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80",
    ],
    features: ["solar_system", "inverter_battery", "security_estate", "swimming_pool", "braai_area", "garden", "flatlet", "staff_quarters", "pet_friendly", "fibre_ready"],
  },
  {
    id: "steenberg-golf-estate",
    slug: "steenberg-golf-estate",
    title: "Steenberg Private Winelands & Golf Estate Villa",
    location: "Steenberg Boulevard, Tokai / Constantia Valley, Cape Town, Western Cape",
    suburb: "Constantia",
    city: "Cape Town",
    province: "Western Cape",
    price: "R 15,900,000",
    numericPrice: 15900000,
    type: "Villa",
    listingType: "sale",
    beds: 5,
    baths: 5.5,
    tag: "For Sale",
    image: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80",
    category: "Historic Winelands Golf Sanctuary",
    description:
      "Ultra-luxury residence positioned directly along the championship fairways of Steenberg Golf Estate with uninterrupted vistas of the Constantiaberg mountain range. Features 15kW solar microgrid, private wine tasting cellar, temperature-regulated infinity pool, integrated Gaggenau kitchen, designer braai terrace with automated weather blinds, luxury staff suite, and premier 24h armed security.",
    area: "660 m²",
    parking: 4,
    rating: 5.0,
    status: "Featured",
    gallery: [
      "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1200&q=80",
    ],
    features: ["solar_system", "inverter_battery", "borehole", "security_estate", "swimming_pool", "braai_area", "garden", "staff_quarters", "fibre_ready", "pet_friendly"],
  },
];

export async function getPropertyList(): Promise<PropertyRecord[]> {
  if (!isFirebaseConfigured || !db) {
    return fallbackProperties;
  }

  try {
    const propertiesRef = collection(db, "properties");
    const q = query(propertiesRef, where("status", "in", publicStatuses));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return fallbackProperties;
    }

    const firestoreItems: PropertyRecord[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const rawPrice = data.price ?? "0";
      const cleanNum = Number(String(rawPrice).replace(/[^0-9.]/g, "")) || 0;
      const features = Array.isArray(data.features) ? data.features : ["security_estate"];

      return {
        id: docSnap.id,
        slug: data.slug ?? docSnap.id,
        title: data.title ?? "Untitled property",
        location: data.location ?? "South Africa",
        suburb: data.suburb ?? "",
        city: data.city ?? "Pretoria",
        province: data.province ?? "Gauteng",
        price: data.price ?? "Price on request",
        numericPrice: cleanNum,
        type: (data.type as PropertyType) ?? "House",
        listingType: (data.listingType as "sale" | "rent") ?? "sale",
        leaseTerm: data.leaseTerm,
        depositRequired: data.depositRequired ? Number(data.depositRequired) : undefined,
        furnishedStatus: data.furnishedStatus,
        beds: Number(data.beds ?? 0),
        baths: Number(data.baths ?? 0),
        tag: data.tag ?? "Featured",
        image: data.image ?? fallbackProperties[0].image,
        category: data.category ?? "Premium home",
        description: data.description ?? "A beautiful property from Dynasty Estates.",
        area: data.area ?? (data.erfSizeSqm ? `${data.erfSizeSqm} m²` : "Available on request"),
        parking: Number(data.parking ?? 2),
        rating: Number(data.rating ?? 4.8),
        status: data.status ?? "Published",
        gallery: Array.isArray(data.gallery) && data.gallery.length > 0
          ? data.gallery
          : [data.image ?? fallbackProperties[0].image],
        features,
      };
    });

    // Combine firestore records with fallback properties so the catalogue always has rich search results
    const combined = [...firestoreItems];
    for (const fp of fallbackProperties) {
      if (!combined.some((item) => item.id === fp.id || item.slug === fp.slug)) {
        combined.push(fp);
      }
    }
    return combined;
  } catch (error) {
    // No demo fallback on error. Returning fallbackProperties here made a denied
    // or misconfigured query look like a healthy catalogue of twenty listings,
    // which is how the publish-path bug stayed invisible. Demo data is still
    // returned above when Firebase is absent or the collection is genuinely empty.
    console.error("Property catalogue query failed:", error);
    throw new Error("Unable to load the property catalogue.", { cause: error });
  }
}

export async function getPropertyBySlug(slug: string): Promise<PropertyRecord | null> {
  const properties = await getPropertyList();
  return properties.find((property) => property.slug === slug || property.id === slug) ?? null;
}
