export type EnhancementCategory =
  | "CCTV"
  | "Alarms"
  | "Solar"
  | "Generators"
  | "Electric fence"
  | "Access control";

export type EnhancementPartner = {
  id: string;
  name: string;
  tagline: string;
  region: string;
  cityTown: string;
  neighborhood?: string;
  categories: EnhancementCategory[];
  phone?: string;
  address?: string;
  mapsQuery?: string;
};

/** Vendors landlords can contact to upgrade security and power on a listing. */
export const ENHANCEMENT_PARTNERS: EnhancementPartner[] = [
  {
    id: "secure-view-osu",
    name: "SecureView Accra",
    tagline: "CCTV kits, DVR installs, and night-vision cameras for compounds",
    region: "Greater Accra",
    cityTown: "Accra",
    neighborhood: "Osu",
    categories: ["CCTV", "Access control"],
    phone: "+233302555201",
    address: "Oxford Street area, Osu",
    mapsQuery: "CCTV installers Accra Osu",
  },
  {
    id: "guardtech-east-legon",
    name: "GuardTech East Legon",
    tagline: "Alarm panels, motion sensors, and monitored sirens",
    region: "Greater Accra",
    cityTown: "Accra",
    neighborhood: "East Legon",
    categories: ["Alarms", "CCTV"],
    phone: "+233244901122",
    address: "East Legon junction",
    mapsQuery: "security alarm installers East Legon",
  },
  {
    id: "sunpower-spintex",
    name: "SunPower Ghana Spintex",
    tagline: "Rooftop solar, inverters, and battery backup for rentals",
    region: "Greater Accra",
    cityTown: "Accra",
    neighborhood: "Spintex",
    categories: ["Solar"],
    phone: "+233302774901",
    address: "Spintex Road",
    mapsQuery: "solar installers Spintex Accra",
  },
  {
    id: "powergen-tema",
    name: "PowerGen Tema",
    tagline: "Standby generators and ATS switches for estates",
    region: "Greater Accra",
    cityTown: "Tema",
    neighborhood: "Community 25",
    categories: ["Generators"],
    phone: "+233303203040",
    address: "Industrial area, Tema",
    mapsQuery: "generator dealers Tema",
  },
  {
    id: "fence-safe-madina",
    name: "FenceSafe Madina",
    tagline: "Electric fencing and perimeter beam kits for walled homes",
    region: "Greater Accra",
    cityTown: "Accra",
    neighborhood: "Madina",
    categories: ["Electric fence", "Alarms"],
    phone: "+233244556677",
    address: "Madina Zongo Junction area",
    mapsQuery: "electric fence installers Madina Accra",
  },
  {
    id: "solara-kumasi",
    name: "Solara Ashanti",
    tagline: "Solar + inverter packages sized for Kumasi flats and houses",
    region: "Ashanti",
    cityTown: "Kumasi",
    neighborhood: "Ahodwo",
    categories: ["Solar", "Generators"],
    phone: "+233322045678",
    address: "Near Ahodwo roundabout",
    mapsQuery: "solar installers Kumasi",
  },
  {
    id: "lensguard-airport",
    name: "LensGuard Airport Residential",
    tagline: "Wireless CCTV and doorbell cameras for apartments",
    region: "Greater Accra",
    cityTown: "Accra",
    neighborhood: "Airport Residential",
    categories: ["CCTV", "Access control"],
    phone: "+233302112233",
    address: "Airport Residential area",
    mapsQuery: "CCTV Airport Residential Accra",
  },
  {
    id: "brightgrid-labone",
    name: "BrightGrid Labone",
    tagline: "Hybrid solar systems and prepaid-friendly metering advice",
    region: "Greater Accra",
    cityTown: "Accra",
    neighborhood: "Labone",
    categories: ["Solar"],
    phone: "+233244889900",
    address: "Labone Crescent area",
    mapsQuery: "solar companies Labone Accra",
  },
];

export const ENHANCEMENT_CATEGORY_FILTERS: Array<
  EnhancementCategory | "All"
> = [
  "All",
  "CCTV",
  "Alarms",
  "Solar",
  "Generators",
  "Electric fence",
  "Access control",
];

/** Prefer same neighborhood, then city, then region; always fill to limit. */
export function enhancementPartnersForOwner(input: {
  region?: string;
  cityTown?: string;
  neighborhood?: string;
  category?: EnhancementCategory | "All";
  limit?: number;
}): EnhancementPartner[] {
  const limit = input.limit ?? 6;
  const category = input.category ?? "All";
  const region = (input.region ?? "").toLowerCase();
  const city = (input.cityTown ?? "").toLowerCase();
  const neighborhood = (input.neighborhood ?? "").toLowerCase();

  const pool =
    category === "All"
      ? ENHANCEMENT_PARTNERS
      : ENHANCEMENT_PARTNERS.filter((p) => p.categories.includes(category));

  const scored = pool
    .map((partner) => {
      let score = 1;
      if (region && partner.region.toLowerCase() === region) score += 2;
      if (city && partner.cityTown.toLowerCase() === city) score += 4;
      if (
        neighborhood &&
        partner.neighborhood &&
        partner.neighborhood.toLowerCase() === neighborhood
      ) {
        score += 6;
      }
      return { partner, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((row) => row.partner);
}
