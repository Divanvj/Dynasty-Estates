/**
 * Reader-facing names for the amenity ids stored on a listing.
 *
 * Every surface that shows a listing's features used to case its own ids with a
 * local `.replace("_", " ")`, which gave the visitor "inverter battery",
 * "staff quarters" and "fibre ready" in lower case on the detail page, both
 * card surfaces, the AI results and the structured data we hand to search
 * engines. Two of those calls passed a string rather than a regex, so they
 * replaced only the FIRST underscore — harmless today because no id has two,
 * and a trap the moment one does.
 *
 * The ids below are the complete set the catalogue uses, counted over `src`
 * rather than assumed: inverter_battery (20), security_estate (18),
 * fibre_ready (17), solar_system (16), garden (15), braai_area (15),
 * swimming_pool (14), pet_friendly (13), staff_quarters (7), borehole (6),
 * water_tanks (5), flatlet (4).
 *
 * Labels are sentence case, not title case: they read as prose in the AI
 * concierge's "No borehole" and as list items everywhere else, and title case
 * in a list of twelve looks like a form, not a home.
 */
export const FEATURE_LABELS: Record<string, string> = {
  solar_system: "Solar system",
  inverter_battery: "Inverter & battery",
  borehole: "Borehole",
  water_tanks: "Water tanks",
  security_estate: "Security estate",
  swimming_pool: "Swimming pool",
  braai_area: "Braai area",
  garden: "Garden",
  staff_quarters: "Staff quarters",
  flatlet: "Flatlet",
  pet_friendly: "Pet friendly",
  fibre_ready: "Fibre ready",
};

/**
 * The label for an amenity id, falling back to a readable form of the id.
 *
 * The fallback exists so a new id added to the catalogue before it is added
 * here still reads as words rather than as a database key.
 */
export function featureLabel(id: string): string {
  const known = FEATURE_LABELS[id];
  if (known) return known;
  const words = id.replace(/_/g, " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : id;
}
