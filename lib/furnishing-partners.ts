export type FurnishingPartner = {
  id: string;
  name: string;
  tagline: string;
  region: string;
  cityTown: string;
  neighborhood?: string;
  categories: string[];
  phone?: string;
  address?: string;
  mapsQuery?: string;
};

/** Curated furnishing shops renters can use when a home is not fully furnished. */
export const FURNISHING_PARTNERS: FurnishingPartner[] = [
  {
    id: "sofa-king-osu",
    name: "Sofa King Accra",
    tagline: "Beds, sofas, and ready rooms for new tenants",
    region: "Greater Accra",
    cityTown: "Accra",
    neighborhood: "Osu",
    categories: ["Beds", "Sofas", "Wardrobes"],
    phone: "+233302555101",
    address: "Oxford Street area, Osu",
    mapsQuery: "Sofa King Accra Osu",
  },
  {
    id: "melcom-spintex",
    name: "Melcom Spintex",
    tagline: "Appliances, mattresses, and starter kitchen kits",
    region: "Greater Accra",
    cityTown: "Accra",
    neighborhood: "Spintex",
    categories: ["Appliances", "Mattresses", "Kitchen"],
    phone: "+233302774830",
    address: "Spintex Road",
    mapsQuery: "Melcom Spintex Accra",
  },
  {
    id: "furniture-palace-east-legon",
    name: "Furniture Palace East Legon",
    tagline: "Dining sets and living-room packages for flats",
    region: "Greater Accra",
    cityTown: "Accra",
    neighborhood: "East Legon",
    categories: ["Dining", "Sofas", "Tables"],
    phone: "+233244112233",
    address: "East Legon junction",
    mapsQuery: "Furniture Palace East Legon",
  },
  {
    id: "tema-home-mart",
    name: "Tema Home Mart",
    tagline: "Affordable furnishings for Tema and Community estates",
    region: "Greater Accra",
    cityTown: "Tema",
    neighborhood: "Community 25",
    categories: ["Beds", "Curtains", "Storage"],
    phone: "+233303202020",
    address: "Community 1 market road, Tema",
    mapsQuery: "Tema furniture shops",
  },
  {
    id: "kumasi-woodworks",
    name: "Asante Woodworks",
    tagline: "Custom beds and cabinets for Kumasi rentals",
    region: "Ashanti",
    cityTown: "Kumasi",
    neighborhood: "Ahodwo",
    categories: ["Beds", "Cabinets", "Custom wood"],
    phone: "+233322022110",
    address: "Near Ahodwo roundabout",
    mapsQuery: "furniture shops Ahodwo Kumasi",
  },
  {
    id: "madina-furnish",
    name: "Madina Furnish Hub",
    tagline: "Budget sofas and mattresses near Madina estates",
    region: "Greater Accra",
    cityTown: "Accra",
    neighborhood: "Madina",
    categories: ["Sofas", "Mattresses"],
    phone: "+233244778899",
    address: "Madina Zongo Junction area",
    mapsQuery: "furniture Madina Accra",
  },
];

export function needsFurnishingHelp(
  furnishing: "unfurnished" | "semi_furnished" | "furnished"
): boolean {
  return furnishing === "unfurnished" || furnishing === "semi_furnished";
}

/** Prefer same neighborhood, then city, then region. */
export function partnersForListing(input: {
  region: string;
  cityTown: string;
  neighborhood: string;
  limit?: number;
}): FurnishingPartner[] {
  const limit = input.limit ?? 3;
  const region = input.region.toLowerCase();
  const city = input.cityTown.toLowerCase();
  const neighborhood = input.neighborhood.toLowerCase();

  const scored = FURNISHING_PARTNERS.map((partner) => {
    let score = 0;
    if (partner.region.toLowerCase() === region) score += 2;
    if (partner.cityTown.toLowerCase() === city) score += 4;
    if (
      partner.neighborhood &&
      partner.neighborhood.toLowerCase() === neighborhood
    ) {
      score += 6;
    }
    return { partner, score };
  })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  const picked = scored.slice(0, limit).map((row) => row.partner);
  if (picked.length >= limit) return picked;

  // Fallback: fill with Accra partners if nothing nearby matched enough
  const fallback = FURNISHING_PARTNERS.filter(
    (p) => !picked.some((x) => x.id === p.id)
  );
  return [...picked, ...fallback].slice(0, limit);
}
