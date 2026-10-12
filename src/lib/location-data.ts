/**
 * South African Location Taxonomy & Hierarchy
 * Maps Suburbs -> Cities / Metros -> Provinces
 */

export type SouthAfricanProvince =
  | "Gauteng"
  | "Western Cape"
  | "KwaZulu-Natal"
  | "Eastern Cape"
  | "Free State"
  | "Limpopo"
  | "Mpumalanga"
  | "North West"
  | "Northern Cape";

export const SOUTH_AFRICAN_PROVINCES: SouthAfricanProvince[] = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
];

export interface CityItem {
  name: string;
  province: SouthAfricanProvince;
  aliases?: string[];
}

export interface SuburbItem {
  name: string;
  city: string;
  province: SouthAfricanProvince;
  aliases?: string[];
}

// Master list of South African Cities & Metros (alphabetical order)
export const SOUTH_AFRICAN_CITIES: CityItem[] = [
  { name: "Alberton", province: "Gauteng" },
  { name: "Amanzimtoti", province: "KwaZulu-Natal" },
  { name: "Ballito", province: "KwaZulu-Natal" },
  { name: "Barberton", province: "Mpumalanga" },
  { name: "Bathurst", province: "Eastern Cape" },
  { name: "Bedfordview", province: "Gauteng" },
  { name: "Bela-Bela", province: "Limpopo", aliases: ["Warmbaths", "Bela-Bela (Warmbaths)"] },
  { name: "Benoni", province: "Gauteng" },
  { name: "Bethlehem", province: "Free State" },
  { name: "Bhisho", province: "Eastern Cape" },
  { name: "Bloemfontein", province: "Free State" },
  { name: "Boksburg", province: "Gauteng" },
  { name: "Brakpan", province: "Gauteng" },
  { name: "Brits", province: "North West" },
  { name: "Bryanston", province: "Gauteng" },
  { name: "Calvinia", province: "Northern Cape" },
  { name: "Camps Bay", province: "Western Cape" },
  { name: "Cape Town", province: "Western Cape" },
  { name: "Centurion", province: "Gauteng" },
  { name: "Ceres", province: "Western Cape" },
  { name: "Clarens", province: "Free State" },
  { name: "Colesberg", province: "Northern Cape" },
  { name: "Constantia", province: "Western Cape" },
  { name: "Cradock", province: "Eastern Cape" },
  { name: "Dainfern", province: "Gauteng" },
  { name: "De Aar", province: "Northern Cape" },
  { name: "Dolphin Coast", province: "KwaZulu-Natal" },
  { name: "Douglas", province: "Northern Cape" },
  { name: "Drakensberg", province: "KwaZulu-Natal" },
  { name: "Dullstroom", province: "Mpumalanga" },
  { name: "Dundee", province: "KwaZulu-Natal" },
  { name: "Durban", province: "KwaZulu-Natal" },
  { name: "East London", province: "Eastern Cape" },
  { name: "eMalahleni", province: "Mpumalanga", aliases: ["Witbank", "eMalahleni (Witbank)"] },
  { name: "Empangeni", province: "KwaZulu-Natal" },
  { name: "Ficksburg", province: "Free State" },
  { name: "Fourways", province: "Gauteng" },
  { name: "Franschhoek", province: "Western Cape" },
  { name: "George", province: "Western Cape" },
  { name: "Germiston", province: "Gauteng" },
  { name: "Giyani", province: "Limpopo" },
  { name: "Gqeberha", province: "Eastern Cape", aliases: ["Port Elizabeth", "Gqeberha (Port Elizabeth)", "PE"] },
  { name: "Graaff-Reinet", province: "Eastern Cape" },
  { name: "Grahamstown", province: "Eastern Cape", aliases: ["Makhanda", "Grahamstown (Makhanda)"] },
  { name: "Graskop", province: "Mpumalanga" },
  { name: "Harrismith", province: "Free State" },
  { name: "Hartbeespoort", province: "North West" },
  { name: "Hazyview", province: "Mpumalanga" },
  { name: "Heidelberg", province: "Gauteng" },
  { name: "Hermanus", province: "Western Cape" },
  { name: "Hillcrest", province: "KwaZulu-Natal" },
  { name: "Hoedspruit", province: "Limpopo" },
  { name: "Howick", province: "KwaZulu-Natal" },
  { name: "Jeffreys Bay", province: "Eastern Cape", aliases: ["J-Bay"] },
  { name: "Johannesburg", province: "Gauteng", aliases: ["Joburg", "JHB"] },
  { name: "Kakamas", province: "Northern Cape" },
  { name: "Kathu", province: "Northern Cape" },
  { name: "Kempton Park", province: "Gauteng" },
  { name: "Kenton-on-Sea", province: "Eastern Cape" },
  { name: "Kimberley", province: "Northern Cape" },
  { name: "Klerksdorp", province: "North West" },
  { name: "Kloof", province: "KwaZulu-Natal" },
  { name: "Knysna", province: "Western Cape" },
  { name: "Kokstad", province: "KwaZulu-Natal" },
  { name: "Kroonstad", province: "Free State" },
  { name: "Krugersdorp", province: "Gauteng" },
  { name: "Kuruman", province: "Northern Cape" },
  { name: "Ladysmith", province: "KwaZulu-Natal" },
  { name: "Langebaan", province: "Western Cape" },
  { name: "Lephalale", province: "Limpopo", aliases: ["Ellisras", "Lephalale (Ellisras)"] },
  { name: "Lichtenburg", province: "North West" },
  { name: "Louis Trichardt", province: "Limpopo", aliases: ["Makhado", "Louis Trichardt (Makhado)"] },
  { name: "Lydenburg", province: "Mpumalanga", aliases: ["Mashishing", "Lydenburg (Mashishing)"] },
  { name: "Mahikeng", province: "North West", aliases: ["Mafikeng", "Mahikeng (Mafikeng)"] },
  { name: "Malelane", province: "Mpumalanga" },
  { name: "Margate", province: "KwaZulu-Natal" },
  { name: "Mbombela", province: "Mpumalanga", aliases: ["Nelspruit", "Mbombela (Nelspruit)"] },
  { name: "Menlyn Maine", province: "Gauteng" },
  { name: "Middelburg", province: "Mpumalanga" },
  { name: "Midrand", province: "Gauteng" },
  { name: "Mokopane", province: "Limpopo", aliases: ["Potgietersrus", "Mokopane (Potgietersrus)"] },
  { name: "Morningside", province: "Gauteng" },
  { name: "Mossel Bay", province: "Western Cape" },
  { name: "Musina", province: "Limpopo", aliases: ["Messina"] },
  { name: "Newcastle", province: "KwaZulu-Natal" },
  { name: "Orkney", province: "North West" },
  { name: "Oudtshoorn", province: "Western Cape" },
  { name: "Paarl", province: "Western Cape" },
  { name: "Parys", province: "Free State" },
  { name: "Phalaborwa", province: "Limpopo" },
  { name: "Phuthaditjhaba", province: "Free State" },
  { name: "Pietermaritzburg", province: "KwaZulu-Natal", aliases: ["PMB"] },
  { name: "Pinetown", province: "KwaZulu-Natal" },
  { name: "Plettenberg Bay", province: "Western Cape", aliases: ["Plett"] },
  { name: "Polokwane", province: "Limpopo", aliases: ["Pietersburg", "Polokwane (Pietersburg)"] },
  { name: "Port Alfred", province: "Eastern Cape" },
  { name: "Port Nolloth", province: "Northern Cape" },
  { name: "Port Shepstone", province: "KwaZulu-Natal" },
  { name: "Potchefstroom", province: "North West", aliases: ["Potch"] },
  { name: "Pretoria", province: "Gauteng", aliases: ["Tshwane", "PTA"] },
  { name: "Queenstown", province: "Eastern Cape", aliases: ["Komani", "Queenstown (Komani)"] },
  { name: "Randburg", province: "Gauteng" },
  { name: "Richards Bay", province: "KwaZulu-Natal" },
  { name: "Robertson", province: "Western Cape" },
  { name: "Roodepoort", province: "Gauteng" },
  { name: "Rosebank", province: "Gauteng" },
  { name: "Rustenburg", province: "North West" },
  { name: "Sabie", province: "Mpumalanga" },
  { name: "Saldanha", province: "Western Cape" },
  { name: "Salt Rock", province: "KwaZulu-Natal" },
  { name: "Sandton", province: "Gauteng" },
  { name: "Sasolburg", province: "Free State" },
  { name: "Schweizer-Reneke", province: "North West" },
  { name: "Sea Point", province: "Western Cape" },
  { name: "Secunda", province: "Mpumalanga" },
  { name: "Silver Lakes", province: "Gauteng" },
  { name: "Somerset West", province: "Western Cape" },
  { name: "Soweto", province: "Gauteng" },
  { name: "Springbok", province: "Northern Cape" },
  { name: "Springs", province: "Gauteng" },
  { name: "St Francis Bay", province: "Eastern Cape" },
  { name: "Standerton", province: "Mpumalanga" },
  { name: "Stellenbosch", province: "Western Cape" },
  { name: "Summerstrand", province: "Eastern Cape" },
  { name: "Sun City", province: "North West" },
  { name: "Swellendam", province: "Western Cape" },
  { name: "Thabazimbi", province: "Limpopo" },
  { name: "Tzaneen", province: "Limpopo" },
  { name: "Uitenhage", province: "Eastern Cape", aliases: ["Kariega", "Uitenhage (Kariega)"] },
  { name: "Umhlanga", province: "KwaZulu-Natal", aliases: ["Umhlanga Rocks"] },
  { name: "Upington", province: "Northern Cape" },
  { name: "Vanderbijlpark", province: "Gauteng" },
  { name: "Vereeniging", province: "Gauteng" },
  { name: "Vryburg", province: "North West" },
  { name: "Vryheid", province: "KwaZulu-Natal" },
  { name: "Waterfall City", province: "Gauteng", aliases: ["Waterfall"] },
  { name: "Waterkloof", province: "Gauteng" },
  { name: "Welkom", province: "Free State" },
  { name: "White River", province: "Mpumalanga" },
  { name: "Woodland Hills", province: "Free State" },
  { name: "Worcester", province: "Western Cape" },
  { name: "Zeerust", province: "North West" },
];

// Master list of prominent South African Suburbs and Estates mapped to City and Province
export const SOUTH_AFRICAN_SUBURBS: SuburbItem[] = [
  // Gauteng - Pretoria / Tshwane
  { name: "Akasia", city: "Pretoria", province: "Gauteng" },
  { name: "Boardwalk", city: "Pretoria", province: "Gauteng" },
  { name: "Brooklyn", city: "Pretoria", province: "Gauteng" },
  { name: "Centurion Golf Estate", city: "Centurion", province: "Gauteng" },
  { name: "Clubview", city: "Centurion", province: "Gauteng" },
  { name: "Constantia Glen", city: "Pretoria", province: "Gauteng" },
  { name: "Cornwall Hill", city: "Centurion", province: "Gauteng" },
  { name: "Die Wilgers", city: "Pretoria", province: "Gauteng" },
  { name: "Elarduspark", city: "Pretoria", province: "Gauteng" },
  { name: "Eldoraigne", city: "Centurion", province: "Gauteng" },
  { name: "Equestria", city: "Pretoria", province: "Gauteng" },
  { name: "Erasmuskloof", city: "Pretoria", province: "Gauteng" },
  { name: "Faerie Glen", city: "Pretoria", province: "Gauteng" },
  { name: "Garsfontein", city: "Pretoria", province: "Gauteng" },
  { name: "Groenkloof", city: "Pretoria", province: "Gauteng" },
  { name: "Hazelwood", city: "Pretoria", province: "Gauteng" },
  { name: "Irene", city: "Centurion", province: "Gauteng" },
  { name: "Lynnwood", city: "Pretoria", province: "Gauteng" },
  { name: "Lynnwood Glen", city: "Pretoria", province: "Gauteng" },
  { name: "Lynnwood Ridge", city: "Pretoria", province: "Gauteng" },
  { name: "Menlyn", city: "Pretoria", province: "Gauteng" },
  { name: "Menlyn Maine", city: "Pretoria", province: "Gauteng" },
  { name: "Midstream", city: "Centurion", province: "Gauteng", aliases: ["Midstream Estate"] },
  { name: "Montana", city: "Pretoria", province: "Gauteng" },
  { name: "Mooikloof", city: "Pretoria", province: "Gauteng", aliases: ["Mooikloof Equestrian Estate"] },
  { name: "Pretoria East", city: "Pretoria", province: "Gauteng" },
  { name: "Pretoria North", city: "Pretoria", province: "Gauteng" },
  { name: "Rooihuiskraal", city: "Centurion", province: "Gauteng" },
  { name: "Silver Lakes", city: "Pretoria", province: "Gauteng", aliases: ["Silver Lakes Golf Estate"] },
  { name: "Wapadrand", city: "Pretoria", province: "Gauteng" },
  { name: "Waterkloof", city: "Pretoria", province: "Gauteng" },
  { name: "Waterkloof Heights", city: "Pretoria", province: "Gauteng" },
  { name: "Waterkloof Park", city: "Pretoria", province: "Gauteng" },
  { name: "Waterkloof Ridge", city: "Pretoria", province: "Gauteng" },
  { name: "Woodhill", city: "Pretoria", province: "Gauteng", aliases: ["Woodhill Golf Estate"] },
  { name: "Zwartkop", city: "Centurion", province: "Gauteng" },

  // Gauteng - Johannesburg & Sandton
  { name: "Atholl", city: "Johannesburg", province: "Gauteng" },
  { name: "Auckland Park", city: "Johannesburg", province: "Gauteng" },
  { name: "Bedfordview", city: "Johannesburg", province: "Gauteng" },
  { name: "Blairgowrie", city: "Randburg", province: "Gauteng" },
  { name: "Blue Hills", city: "Midrand", province: "Gauteng" },
  { name: "Bordeaux", city: "Randburg", province: "Gauteng" },
  { name: "Boskruin", city: "Randburg", province: "Gauteng" },
  { name: "Bryanston", city: "Johannesburg", province: "Gauteng", aliases: ["Bryanston East", "Bryanston West"] },
  { name: "Carlswald", city: "Midrand", province: "Gauteng" },
  { name: "Constantia Kloof", city: "Roodepoort", province: "Gauteng" },
  { name: "Craighall", city: "Johannesburg", province: "Gauteng" },
  { name: "Craighall Park", city: "Johannesburg", province: "Gauteng" },
  { name: "Cresta", city: "Randburg", province: "Gauteng" },
  { name: "Crowthorne", city: "Midrand", province: "Gauteng" },
  { name: "Dainfern", city: "Johannesburg", province: "Gauteng", aliases: ["Dainfern Golf Estate", "Dainfern Valley"] },
  { name: "Dunkeld", city: "Johannesburg", province: "Gauteng", aliases: ["Dunkeld West"] },
  { name: "Featherbrooke", city: "Roodepoort", province: "Gauteng", aliases: ["Featherbrooke Estate"] },
  { name: "Ferndale", city: "Randburg", province: "Gauteng" },
  { name: "Florida", city: "Roodepoort", province: "Gauteng" },
  { name: "Fourways", city: "Johannesburg", province: "Gauteng" },
  { name: "Fourways Gardens", city: "Johannesburg", province: "Gauteng" },
  { name: "Greenside", city: "Johannesburg", province: "Gauteng" },
  { name: "Helderkruin", city: "Roodepoort", province: "Gauteng" },
  { name: "Houghton", city: "Johannesburg", province: "Gauteng", aliases: ["Houghton Estate"] },
  { name: "Hurlingham", city: "Johannesburg", province: "Gauteng" },
  { name: "Hyde Park", city: "Johannesburg", province: "Gauteng" },
  { name: "Illovo", city: "Johannesburg", province: "Gauteng" },
  { name: "Inanda", city: "Johannesburg", province: "Gauteng" },
  { name: "Kyalami", city: "Midrand", province: "Gauteng", aliases: ["Kyalami Estates"] },
  { name: "Linden", city: "Johannesburg", province: "Gauteng" },
  { name: "Melrose", city: "Johannesburg", province: "Gauteng" },
  { name: "Melrose Arch", city: "Johannesburg", province: "Gauteng" },
  { name: "Morningside", city: "Johannesburg", province: "Gauteng" },
  { name: "Northcliff", city: "Johannesburg", province: "Gauteng" },
  { name: "Norwood", city: "Johannesburg", province: "Gauteng" },
  { name: "Observatory", city: "Johannesburg", province: "Gauteng" },
  { name: "Parkhurst", city: "Johannesburg", province: "Gauteng" },
  { name: "Parktown", city: "Johannesburg", province: "Gauteng" },
  { name: "Parktown North", city: "Johannesburg", province: "Gauteng" },
  { name: "Parkwood", city: "Johannesburg", province: "Gauteng" },
  { name: "Randpark Ridge", city: "Randburg", province: "Gauteng" },
  { name: "River Club", city: "Johannesburg", province: "Gauteng" },
  { name: "Rivonia", city: "Johannesburg", province: "Gauteng" },
  { name: "Robindale", city: "Randburg", province: "Gauteng" },
  { name: "Rosebank", city: "Johannesburg", province: "Gauteng" },
  { name: "Ruimsig", city: "Roodepoort", province: "Gauteng" },
  { name: "Sandhurst", city: "Johannesburg", province: "Gauteng" },
  { name: "Sandown", city: "Johannesburg", province: "Gauteng" },
  { name: "Sandton", city: "Johannesburg", province: "Gauteng", aliases: ["Sandton Central"] },
  { name: "Saxonwold", city: "Johannesburg", province: "Gauteng" },
  { name: "Strathavon", city: "Johannesburg", province: "Gauteng" },
  { name: "Sunninghill", city: "Johannesburg", province: "Gauteng" },
  { name: "Vorna Valley", city: "Midrand", province: "Gauteng" },
  { name: "Waterfall", city: "Midrand", province: "Gauteng", aliases: ["Waterfall City", "Waterfall Country Estate", "Waterfall Valley"] },
  { name: "Weltevredenpark", city: "Roodepoort", province: "Gauteng" },
  { name: "Westcliff", city: "Johannesburg", province: "Gauteng" },
  { name: "Woodmead", city: "Johannesburg", province: "Gauteng" },

  // Western Cape - Cape Town Atlantic Seaboard & City Bowl
  { name: "Bantry Bay", city: "Cape Town", province: "Western Cape" },
  { name: "Big Bay", city: "Cape Town", province: "Western Cape" },
  { name: "Bishopscourt", city: "Cape Town", province: "Western Cape" },
  { name: "Bloubergstrand", city: "Cape Town", province: "Western Cape" },
  { name: "Camps Bay", city: "Cape Town", province: "Western Cape" },
  { name: "Century City", city: "Cape Town", province: "Western Cape" },
  { name: "City Bowl", city: "Cape Town", province: "Western Cape" },
  { name: "Claremont", city: "Cape Town", province: "Western Cape", aliases: ["Claremont Upper"] },
  { name: "Clifton", city: "Cape Town", province: "Western Cape" },
  { name: "Constantia", city: "Cape Town", province: "Western Cape", aliases: ["Constantia Upper"] },
  { name: "Durbanville", city: "Cape Town", province: "Western Cape" },
  { name: "Fish Hoek", city: "Cape Town", province: "Western Cape" },
  { name: "Fresnaye", city: "Cape Town", province: "Western Cape" },
  { name: "Gordon's Bay", city: "Cape Town", province: "Western Cape" },
  { name: "Green Point", city: "Cape Town", province: "Western Cape" },
  { name: "Higgovale", city: "Cape Town", province: "Western Cape" },
  { name: "Hout Bay", city: "Cape Town", province: "Western Cape" },
  { name: "Kalk Bay", city: "Cape Town", province: "Western Cape" },
  { name: "Kenilworth", city: "Cape Town", province: "Western Cape", aliases: ["Kenilworth Upper"] },
  { name: "Llandudno", city: "Cape Town", province: "Western Cape" },
  { name: "Melkbosstrand", city: "Cape Town", province: "Western Cape" },
  { name: "Milnerton", city: "Cape Town", province: "Western Cape" },
  { name: "Mouille Point", city: "Cape Town", province: "Western Cape" },
  { name: "Muizenberg", city: "Cape Town", province: "Western Cape" },
  { name: "Newlands", city: "Cape Town", province: "Western Cape" },
  { name: "Noordhoek", city: "Cape Town", province: "Western Cape" },
  { name: "Oranjezicht", city: "Cape Town", province: "Western Cape" },
  { name: "Rondebosch", city: "Cape Town", province: "Western Cape" },
  { name: "Sea Point", city: "Cape Town", province: "Western Cape" },
  { name: "Simon's Town", city: "Cape Town", province: "Western Cape" },
  { name: "Somerset West", city: "Cape Town", province: "Western Cape" },
  { name: "Strand", city: "Cape Town", province: "Western Cape" },
  { name: "Sunset Beach", city: "Cape Town", province: "Western Cape" },
  { name: "Table View", city: "Cape Town", province: "Western Cape" },
  { name: "Tamboerskloof", city: "Cape Town", province: "Western Cape" },
  { name: "V&A Waterfront", city: "Cape Town", province: "Western Cape", aliases: ["Waterfront"] },

  // Western Cape - Winelands & Garden Route
  { name: "Boschenmeer", city: "Paarl", province: "Western Cape", aliases: ["Boschenmeer Golf Estate"] },
  { name: "Brandwacht", city: "Stellenbosch", province: "Western Cape" },
  { name: "Brenton-on-Sea", city: "Knysna", province: "Western Cape" },
  { name: "De Zalze", city: "Stellenbosch", province: "Western Cape", aliases: ["De Zalze Winelands Golf Estate"] },
  { name: "Eastcliff", city: "Hermanus", province: "Western Cape" },
  { name: "Erinvale", city: "Somerset West", province: "Western Cape", aliases: ["Erinvale Golf Estate"] },
  { name: "Fancourt", city: "George", province: "Western Cape", aliases: ["Fancourt Golf Estate"] },
  { name: "Fernkloof", city: "Hermanus", province: "Western Cape" },
  { name: "Franschhoek Valley", city: "Franschhoek", province: "Western Cape" },
  { name: "Franschhoek Village", city: "Franschhoek", province: "Western Cape" },
  { name: "Goose Valley", city: "Plettenberg Bay", province: "Western Cape" },
  { name: "Hartenbos", city: "Mossel Bay", province: "Western Cape" },
  { name: "Heatherlands", city: "George", province: "Western Cape" },
  { name: "Hemel-en-Aarde", city: "Hermanus", province: "Western Cape" },
  { name: "Keurboomstrand", city: "Plettenberg Bay", province: "Western Cape" },
  { name: "Kingswood", city: "George", province: "Western Cape", aliases: ["Kingswood Golf Estate"] },
  { name: "Kwaaiwater", city: "Hermanus", province: "Western Cape" },
  { name: "Langebaan Country Estate", city: "Langebaan", province: "Western Cape" },
  { name: "Leisure Isle", city: "Knysna", province: "Western Cape" },
  { name: "Onrus", city: "Hermanus", province: "Western Cape" },
  { name: "Oubaai", city: "George", province: "Western Cape", aliases: ["Oubaai Golf Resort"] },
  { name: "Paradyskloof", city: "Stellenbosch", province: "Western Cape" },
  { name: "Pearl Valley", city: "Paarl", province: "Western Cape" },
  { name: "Pezula", city: "Knysna", province: "Western Cape", aliases: ["Pezula Private Estate", "Pezula Golf Estate"] },
  { name: "Pinnacle Point", city: "Mossel Bay", province: "Western Cape", aliases: ["Pinnacle Point Estate"] },
  { name: "Robberg Beach", city: "Plettenberg Bay", province: "Western Cape" },
  { name: "Schoongezicht", city: "Plettenberg Bay", province: "Western Cape" },
  { name: "Simola", city: "Knysna", province: "Western Cape", aliases: ["Simola Golf & Country Estate"] },
  { name: "Spanish Farm", city: "Somerset West", province: "Western Cape" },
  { name: "Stellenbosch Central", city: "Stellenbosch", province: "Western Cape" },
  { name: "The Heads", city: "Knysna", province: "Western Cape" },
  { name: "Val de Vie", city: "Paarl", province: "Western Cape", aliases: ["Val de Vie Estate"] },
  { name: "Voëlklip", city: "Hermanus", province: "Western Cape" },
  { name: "Welgevonden", city: "Stellenbosch", province: "Western Cape" },
  { name: "Whale Rock", city: "Plettenberg Bay", province: "Western Cape" },
  { name: "Wilderness", city: "George", province: "Western Cape" },

  // KwaZulu-Natal - Durban & North Coast
  { name: "Athlone", city: "Pietermaritzburg", province: "KwaZulu-Natal" },
  { name: "Ballito Central", city: "Ballito", province: "KwaZulu-Natal" },
  { name: "Berea", city: "Durban", province: "KwaZulu-Natal" },
  { name: "Brettenwood", city: "Ballito", province: "KwaZulu-Natal", aliases: ["Brettenwood Coastal Estate"] },
  { name: "Durban Central", city: "Durban", province: "KwaZulu-Natal" },
  { name: "Durban North", city: "Durban", province: "KwaZulu-Natal" },
  { name: "Gillitts", city: "Durban", province: "KwaZulu-Natal" },
  { name: "Glenwood", city: "Durban", province: "KwaZulu-Natal" },
  { name: "Hillcrest", city: "Durban", province: "KwaZulu-Natal" },
  { name: "Hilton", city: "Pietermaritzburg", province: "KwaZulu-Natal" },
  { name: "Izinga", city: "Durban", province: "KwaZulu-Natal", aliases: ["Izinga Estate", "Izinga Ridge"] },
  { name: "Kloof", city: "Durban", province: "KwaZulu-Natal" },
  { name: "La Lucia", city: "Durban", province: "KwaZulu-Natal" },
  { name: "Morningside", city: "Durban", province: "KwaZulu-Natal" },
  { name: "Mount Edgecombe", city: "Durban", province: "KwaZulu-Natal", aliases: ["Mount Edgecombe Country Club"] },
  { name: "Musgrave", city: "Durban", province: "KwaZulu-Natal" },
  { name: "Palm Lakes", city: "Ballito", province: "KwaZulu-Natal", aliases: ["Palm Lakes Family Estate"] },
  { name: "Point Waterfront", city: "Durban", province: "KwaZulu-Natal" },
  { name: "Salt Rock", city: "Ballito", province: "KwaZulu-Natal" },
  { name: "Seaward Estate", city: "Ballito", province: "KwaZulu-Natal" },
  { name: "Sheffield Beach", city: "Ballito", province: "KwaZulu-Natal" },
  { name: "Sibaya", city: "Durban", province: "KwaZulu-Natal", aliases: ["Sibaya Coastal Precinct"] },
  { name: "Simbithi", city: "Ballito", province: "KwaZulu-Natal", aliases: ["Simbithi Eco Estate"] },
  { name: "Tinley Manor", city: "Ballito", province: "KwaZulu-Natal" },
  { name: "Umhlanga", city: "Durban", province: "KwaZulu-Natal" },
  { name: "Umhlanga Rocks", city: "Durban", province: "KwaZulu-Natal" },
  { name: "Westville", city: "Durban", province: "KwaZulu-Natal" },
  { name: "Willard Beach", city: "Ballito", province: "KwaZulu-Natal" },
  { name: "Zimbali", city: "Ballito", province: "KwaZulu-Natal", aliases: ["Zimbali Coastal Resort", "Zimbali Lakes"] },

  // Limpopo
  { name: "Annadale", city: "Polokwane", province: "Limpopo" },
  { name: "Aqua Park", city: "Tzaneen", province: "Limpopo" },
  { name: "Arbor Park", city: "Tzaneen", province: "Limpopo" },
  { name: "Bela-Bela Central", city: "Bela-Bela", province: "Limpopo" },
  { name: "Bendor", city: "Polokwane", province: "Limpopo", aliases: ["Bendor Park"] },
  { name: "Celtic Meadows", city: "Polokwane", province: "Limpopo" },
  { name: "Eduan Park", city: "Polokwane", province: "Limpopo" },
  { name: "Elements Private Golf Reserve", city: "Bela-Bela", province: "Limpopo" },
  { name: "Flora Park", city: "Polokwane", province: "Limpopo" },
  { name: "Hoedspruit Wildlife Estate", city: "Hoedspruit", province: "Limpopo" },
  { name: "Mabalingwe", city: "Bela-Bela", province: "Limpopo", aliases: ["Mabalingwe Nature Reserve"] },
  { name: "Moditlo", city: "Hoedspruit", province: "Limpopo", aliases: ["Moditlo Wildlife Estate"] },
  { name: "Polokwane Central", city: "Polokwane", province: "Limpopo" },
  { name: "Raptors View", city: "Hoedspruit", province: "Limpopo", aliases: ["Raptors View Wildlife Estate"] },
  { name: "Sterpark", city: "Polokwane", province: "Limpopo" },
  { name: "Thornhill", city: "Polokwane", province: "Limpopo" },
  { name: "Welgelegen", city: "Polokwane", province: "Limpopo" },
  { name: "Woodlands Estate", city: "Polokwane", province: "Limpopo" },
  { name: "Zandspruit Bush & Aero Estate", city: "Hoedspruit", province: "Limpopo" },
  { name: "Zebula", city: "Bela-Bela", province: "Limpopo", aliases: ["Zebula Golf Estate"] },

  // Mpumalanga
  { name: "Dullstroom Village", city: "Dullstroom", province: "Mpumalanga" },
  { name: "Highland Gate Golf Estate", city: "Dullstroom", province: "Mpumalanga" },
  { name: "Matumi Golf Estate", city: "Mbombela", province: "Mpumalanga" },
  { name: "Nelspruit Central", city: "Mbombela", province: "Mpumalanga" },
  { name: "Sonheuwel", city: "Mbombela", province: "Mpumalanga" },
  { name: "Steiltes", city: "Mbombela", province: "Mpumalanga" },
  { name: "Stonehenge", city: "Mbombela", province: "Mpumalanga" },
  { name: "Walkersons", city: "Dullstroom", province: "Mpumalanga", aliases: ["Walkersons Private Estate"] },
  { name: "West Acres", city: "Mbombela", province: "Mpumalanga" },
  { name: "White River Country Estate", city: "White River", province: "Mpumalanga" },

  // Free State
  { name: "Bayswater", city: "Bloemfontein", province: "Free State" },
  { name: "Clarens Golf Estate", city: "Clarens", province: "Free State" },
  { name: "Dan Pienaar", city: "Bloemfontein", province: "Free State" },
  { name: "Langenhovenpark", city: "Bloemfontein", province: "Free State" },
  { name: "Parys Golf & Country Estate", city: "Parys", province: "Free State" },
  { name: "Pentagon Park", city: "Bloemfontein", province: "Free State" },
  { name: "Universitas", city: "Bloemfontein", province: "Free State" },
  { name: "Waverley", city: "Bloemfontein", province: "Free State" },
  { name: "Woodland Hills", city: "Bloemfontein", province: "Free State", aliases: ["Woodland Hills Wildlife Estate"] },

  // North West
  { name: "Baillie Park", city: "Potchefstroom", province: "North West" },
  { name: "Birdwood Estate", city: "Hartbeespoort", province: "North West" },
  { name: "Cashan", city: "Rustenburg", province: "North West" },
  { name: "Estate d'Afrique", city: "Hartbeespoort", province: "North West" },
  { name: "Grimbeeck Park", city: "Potchefstroom", province: "North West" },
  { name: "K'Shane", city: "Hartbeespoort", province: "North West" },
  { name: "Kosmos", city: "Hartbeespoort", province: "North West" },
  { name: "Pecanwood", city: "Hartbeespoort", province: "North West", aliases: ["Pecanwood Golf Estate"] },
  { name: "Safari Gardens", city: "Rustenburg", province: "North West" },
  { name: "The Coves", city: "Hartbeespoort", province: "North West" },
  { name: "Van Der Hoffpark", city: "Potchefstroom", province: "North West" },
  { name: "Waterval", city: "Rustenburg", province: "North West" },
  { name: "Westlake", city: "Hartbeespoort", province: "North West", aliases: ["Westlake Country & Safari Estate"] },
  { name: "Xanadu Eco Park", city: "Hartbeespoort", province: "North West" },

  // Eastern Cape
  { name: "Aston Bay", city: "Jeffreys Bay", province: "Eastern Cape" },
  { name: "Beacon Bay", city: "East London", province: "Eastern Cape" },
  { name: "Bunkers Hill", city: "East London", province: "Eastern Cape" },
  { name: "Cape St Francis", city: "St Francis Bay", province: "Eastern Cape" },
  { name: "Humewood", city: "Gqeberha", province: "Eastern Cape" },
  { name: "Marina Martinique", city: "Jeffreys Bay", province: "Eastern Cape" },
  { name: "Mill Park", city: "Gqeberha", province: "Eastern Cape" },
  { name: "Nahoon", city: "East London", province: "Eastern Cape" },
  { name: "Port St Francis", city: "St Francis Bay", province: "Eastern Cape" },
  { name: "Royal Alfred Marina", city: "Port Alfred", province: "Eastern Cape" },
  { name: "St Francis Bay Links", city: "St Francis Bay", province: "Eastern Cape" },
  { name: "Stirling", city: "East London", province: "Eastern Cape" },
  { name: "Summerstrand", city: "Gqeberha", province: "Eastern Cape" },
  { name: "Walmer", city: "Gqeberha", province: "Eastern Cape" },
  { name: "Wavecrest", city: "Jeffreys Bay", province: "Eastern Cape" },

  // Northern Cape
  { name: "Belgravia", city: "Kimberley", province: "Northern Cape" },
  { name: "Monument Heights", city: "Kimberley", province: "Northern Cape" },
  { name: "Royldene", city: "Kimberley", province: "Northern Cape" },
];

/**
 * Get all South African cities sorted in alphabetical order
 */
export function getAllCitiesAlphabetical(province?: string): CityItem[] {
  let list = [...SOUTH_AFRICAN_CITIES];
  if (province && province !== "All Provinces") {
    list = list.filter((c) => c.province.toLowerCase() === province.toLowerCase());
  }
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Search cities with predictive matching (real-time letter filter)
 * Searches across all SA cities with prefix-matching priority
 */
export function searchCities(query: string, provinceFilter?: string): CityItem[] {
  const clean = query.trim().toLowerCase();
  
  if (!clean) {
    return getAllCitiesAlphabetical(provinceFilter);
  }

  // Search across all cities in SA
  const matches = SOUTH_AFRICAN_CITIES.filter((city) => {
    if (city.name.toLowerCase().includes(clean)) return true;
    if (city.aliases?.some((a) => a.toLowerCase().includes(clean))) return true;
    if (city.province.toLowerCase().includes(clean)) return true;
    return false;
  });

  return matches.sort((a, b) => {
    // 1. Exact match first
    const aExact = a.name.toLowerCase() === clean;
    const bExact = b.name.toLowerCase() === clean;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    // 2. Starts with query first
    const aStarts = a.name.toLowerCase().startsWith(clean);
    const bStarts = b.name.toLowerCase().startsWith(clean);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;

    // 3. Prioritize matching province if specified
    if (provinceFilter && provinceFilter !== "All Provinces") {
      const aMatchesProv = a.province.toLowerCase() === provinceFilter.toLowerCase();
      const bMatchesProv = b.province.toLowerCase() === provinceFilter.toLowerCase();
      if (aMatchesProv && !bMatchesProv) return -1;
      if (!aMatchesProv && bMatchesProv) return 1;
    }

    return a.name.localeCompare(b.name);
  });
}

/**
 * Get all South African suburbs sorted in alphabetical order
 */
export function getAllSuburbsAlphabetical(cityFilter?: string, provinceFilter?: string): SuburbItem[] {
  let list = [...SOUTH_AFRICAN_SUBURBS];

  if (provinceFilter && provinceFilter !== "All Provinces") {
    list = list.filter((s) => s.province.toLowerCase() === provinceFilter.toLowerCase());
  }

  if (cityFilter && cityFilter.trim()) {
    const cleanCity = cityFilter.trim().toLowerCase();
    list = list.filter((s) => s.city.toLowerCase() === cleanCity);
  }

  return list.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Search suburbs with predictive matching (real-time letter filter)
 * If user types a city name (e.g. Polokwane), synthesized entry ensures it appears
 */
export function searchSuburbs(
  query: string,
  cityFilter?: string,
  provinceFilter?: string
): SuburbItem[] {
  const clean = query.trim().toLowerCase();

  // If no query, show alphabetical list
  if (!clean) {
    return getAllSuburbsAlphabetical(cityFilter, provinceFilter);
  }

  const matches = SOUTH_AFRICAN_SUBURBS.filter((suburb) => {
    if (suburb.name.toLowerCase().includes(clean)) return true;
    if (suburb.aliases?.some((a) => a.toLowerCase().includes(clean))) return true;
    if (suburb.city.toLowerCase().includes(clean)) return true;
    return false;
  });

  // Check if query also matches a South African city name (e.g. Polokwane)
  const cityMatch = SOUTH_AFRICAN_CITIES.find(
    (c) => c.name.toLowerCase().startsWith(clean) || c.name.toLowerCase().includes(clean)
  );
  if (cityMatch && !matches.some((m) => m.name.toLowerCase() === cityMatch.name.toLowerCase())) {
    matches.unshift({
      name: cityMatch.name,
      city: cityMatch.name,
      province: cityMatch.province,
    });
  }

  return matches.sort((a, b) => {
    // 1. Exact match
    const aExact = a.name.toLowerCase() === clean;
    const bExact = b.name.toLowerCase() === clean;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    // 2. Starts with query
    const aStarts = a.name.toLowerCase().startsWith(clean);
    const bStarts = b.name.toLowerCase().startsWith(clean);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;

    // 3. City filter preference if set
    if (cityFilter) {
      const aMatchesCity = a.city.toLowerCase() === cityFilter.toLowerCase();
      const bMatchesCity = b.city.toLowerCase() === cityFilter.toLowerCase();
      if (aMatchesCity && !bMatchesCity) return -1;
      if (!aMatchesCity && bMatchesCity) return 1;
    }

    return a.name.localeCompare(b.name);
  });
}

/**
 * Find city item by exact or alias name
 */
export function findCity(name: string): CityItem | undefined {
  if (!name) return undefined;
  const clean = name.trim().toLowerCase();
  return SOUTH_AFRICAN_CITIES.find(
    (c) => c.name.toLowerCase() === clean || c.aliases?.some((a) => a.toLowerCase() === clean)
  );
}

/**
 * Find suburb item by exact or alias name
 */
export function findSuburb(name: string): SuburbItem | undefined {
  if (!name) return undefined;
  const clean = name.trim().toLowerCase();
  return SOUTH_AFRICAN_SUBURBS.find(
    (s) => s.name.toLowerCase() === clean || s.aliases?.some((a) => a.toLowerCase() === clean)
  );
}

/**
 * Get province for city
 */
export function getProvinceForCity(cityName: string): SouthAfricanProvince | undefined {
  const city = findCity(cityName);
  return city?.province;
}

/**
 * Get city and province for suburb
 */
export function getHierarchyForSuburb(
  suburbName: string
): { city: string; province: SouthAfricanProvince } | undefined {
  const suburb = findSuburb(suburbName);
  if (suburb) {
    return { city: suburb.city, province: suburb.province };
  }

  // Fallback check: Did user type a city name in the suburb field? (e.g. Polokwane)
  const city = findCity(suburbName);
  if (city) {
    return { city: city.name, province: city.province };
  }

  return undefined;
}
