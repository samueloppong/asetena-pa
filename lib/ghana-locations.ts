/** Ghana's 16 regions with approximate bounds + popular places for search. */

export type GhanaRegion = {
  name: string;
  /** Approximate bounding box for GPS vs claimed-region checks */
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number };
  cities: string[];
  neighborhoods: string[];
};

export const GHANA_REGIONS: GhanaRegion[] = [
  {
    name: "Ahafo",
    bounds: { minLat: 6.5, maxLat: 7.6, minLng: -2.9, maxLng: -2.1 },
    cities: ["Goaso", "Bechem", "Duayaw Nkwanta"],
    neighborhoods: ["Goaso Central", "Hwidiem"],
  },
  {
    name: "Ashanti",
    bounds: { minLat: 5.9, maxLat: 7.6, minLng: -2.5, maxLng: -0.8 },
    cities: ["Kumasi", "Obuasi", "Ejisu", "Konongo", "Mampong"],
    neighborhoods: [
      "Ahodwo",
      "Asokwa",
      "Bantama",
      "Nhyiaeso",
      "Santasi",
      "Kwadaso",
      "Ayeduase",
      "KNUST",
      "Adum",
    ],
  },
  {
    name: "Bono",
    bounds: { minLat: 7.0, maxLat: 8.3, minLng: -3.0, maxLng: -2.0 },
    cities: ["Sunyani", "Berekum", "Dormaa Ahenkro"],
    neighborhoods: ["Sunyani Central", "Fiapre", "New Dormaa"],
  },
  {
    name: "Bono East",
    bounds: { minLat: 7.2, maxLat: 8.8, minLng: -2.2, maxLng: -0.5 },
    cities: ["Techiman", "Kintampo", "Nkoranza", "Atebubu"],
    neighborhoods: ["Techiman Central", "Kintampo Central"],
  },
  {
    name: "Central",
    bounds: { minLat: 5.0, maxLat: 6.0, minLng: -2.3, maxLng: -0.5 },
    cities: ["Cape Coast", "Winneba", "Kasoa", "Elmina", "Mankessim"],
    neighborhoods: ["Pedu", "Abura", "Kasoa New Town", "Buduburam"],
  },
  {
    name: "Eastern",
    bounds: { minLat: 5.6, maxLat: 7.2, minLng: -1.2, maxLng: 0.5 },
    cities: ["Koforidua", "Nkawkaw", "Akosombo", "Suhum", "Akim Oda"],
    neighborhoods: ["Effiduase", "Old Estate", "Srodae"],
  },
  {
    name: "Greater Accra",
    bounds: { minLat: 5.4, maxLat: 6.0, minLng: -0.55, maxLng: 0.2 },
    cities: ["Accra", "Tema", "Madina", "Teshie", "Nungua", "Dodowa"],
    neighborhoods: [
      "East Legon",
      "Cantonments",
      "Osu",
      "Airport Residential",
      "Labone",
      "Spintex",
      "Dansoman",
      "Adenta",
      "Achimota",
      "Kaneshie",
      "Tema Community 1",
      "Tema Community 25",
      "Sakumono",
      "Haatso",
      "Dzorwulu",
      "Roman Ridge",
      "Ridge",
      "Kokomlemle",
    ],
  },
  {
    name: "North East",
    bounds: { minLat: 10.0, maxLat: 11.2, minLng: -1.0, maxLng: 0.5 },
    cities: ["Nalerigu", "Walewale", "Gambaga"],
    neighborhoods: ["Nalerigu Central", "Walewale Central"],
  },
  {
    name: "Northern",
    bounds: { minLat: 8.5, maxLat: 10.5, minLng: -1.5, maxLng: 0.5 },
    cities: ["Tamale", "Yendi", "Savelugu"],
    neighborhoods: ["Lamashegu", "Kaladan", "Education Ridge", "Vitting"],
  },
  {
    name: "Oti",
    bounds: { minLat: 7.3, maxLat: 8.8, minLng: -0.5, maxLng: 0.7 },
    cities: ["Dambai", "Jasikan", "Kadjebi", "Nkwanta"],
    neighborhoods: ["Dambai Central", "Jasikan Central"],
  },
  {
    name: "Savannah",
    bounds: { minLat: 8.0, maxLat: 10.0, minLng: -2.8, maxLng: -0.8 },
    cities: ["Damongo", "Bole", "Salaga"],
    neighborhoods: ["Damongo Central", "Bole Central"],
  },
  {
    name: "Upper East",
    bounds: { minLat: 10.4, maxLat: 11.2, minLng: -1.5, maxLng: 0.3 },
    cities: ["Bolgatanga", "Bawku", "Navrongo"],
    neighborhoods: ["Zuarungu", "SoE", "Bolgatanga Central"],
  },
  {
    name: "Upper West",
    bounds: { minLat: 9.6, maxLat: 11.0, minLng: -2.8, maxLng: -1.4 },
    cities: ["Wa", "Lawra", "Jirapa", "Tumu"],
    neighborhoods: ["Wa Central", "Kpaguri", "Dondoli"],
  },
  {
    name: "Volta",
    bounds: { minLat: 5.7, maxLat: 7.5, minLng: -0.1, maxLng: 1.2 },
    cities: ["Ho", "Hohoe", "Keta", "Aflao", "Kpando"],
    neighborhoods: ["Ho Bankoe", "Ho Dome", "Aflao Border"],
  },
  {
    name: "Western",
    bounds: { minLat: 4.7, maxLat: 6.2, minLng: -3.3, maxLng: -1.6 },
    cities: ["Takoradi", "Sekondi", "Tarkwa", "Axim"],
    neighborhoods: ["Beach Road", "Anaji", "Effia", "Market Circle"],
  },
  {
    name: "Western North",
    bounds: { minLat: 5.8, maxLat: 7.0, minLng: -3.3, maxLng: -2.2 },
    cities: ["Sefwi Wiawso", "Bibiani", "Enchi"],
    neighborhoods: ["Sefwi Wiawso Central", "Bibiani Central"],
  },
];

/** Rough Ghana national bounding box */
export const GHANA_BOUNDS = {
  minLat: 4.5,
  maxLat: 11.3,
  minLng: -3.35,
  maxLng: 1.3,
};

export type LocationSuggestion = {
  label: string;
  value: string;
  kind: "region" | "city" | "neighborhood";
  region: string;
  city?: string;
};

export function getAllLocationSuggestions(): LocationSuggestion[] {
  const items: LocationSuggestion[] = [];
  for (const region of GHANA_REGIONS) {
    items.push({
      label: `${region.name} Region`,
      value: region.name,
      kind: "region",
      region: region.name,
    });
    for (const city of region.cities) {
      items.push({
        label: `${city}, ${region.name}`,
        value: city,
        kind: "city",
        region: region.name,
        city,
      });
    }
    for (const neighborhood of region.neighborhoods) {
      items.push({
        label: `${neighborhood}, ${region.cities[0] ?? region.name}`,
        value: neighborhood,
        kind: "neighborhood",
        region: region.name,
        city: region.cities[0],
      });
    }
  }
  return items;
}

export function searchGhanaLocations(query: string, limit = 12): LocationSuggestion[] {
  const q = query.trim().toLowerCase();
  const all = getAllLocationSuggestions();
  if (!q) {
    // Default: show all 16 regions first
    return all.filter((s) => s.kind === "region").slice(0, 16);
  }
  return all
    .filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.value.toLowerCase().includes(q) ||
        s.region.toLowerCase().includes(q)
    )
    .slice(0, limit);
}

export function getRegionByName(name: string): GhanaRegion | undefined {
  return GHANA_REGIONS.find(
    (r) => r.name.toLowerCase() === name.trim().toLowerCase()
  );
}

export function isInsideGhana(lat: number, lng: number): boolean {
  return (
    lat >= GHANA_BOUNDS.minLat &&
    lat <= GHANA_BOUNDS.maxLat &&
    lng >= GHANA_BOUNDS.minLng &&
    lng <= GHANA_BOUNDS.maxLng
  );
}

export function isInsideRegion(
  lat: number,
  lng: number,
  regionName: string
): boolean {
  const region = getRegionByName(regionName);
  if (!region) return isInsideGhana(lat, lng);
  const { bounds } = region;
  return (
    lat >= bounds.minLat &&
    lat <= bounds.maxLat &&
    lng >= bounds.minLng &&
    lng <= bounds.maxLng
  );
}

export function detectRegionFromGps(
  lat: number,
  lng: number
): GhanaRegion | undefined {
  return GHANA_REGIONS.find((region) => {
    const { bounds } = region;
    return (
      lat >= bounds.minLat &&
      lat <= bounds.maxLat &&
      lng >= bounds.minLng &&
      lng <= bounds.maxLng
    );
  });
}

export function verifyListingGps(input: {
  latitude: number;
  longitude: number;
  claimedRegion: string;
}): {
  ok: boolean;
  inGhana: boolean;
  regionMatch: boolean;
  detectedRegion?: string;
  message: string;
} {
  const { latitude, longitude, claimedRegion } = input;
  const inGhana = isInsideGhana(latitude, longitude);
  if (!inGhana) {
    return {
      ok: false,
      inGhana: false,
      regionMatch: false,
      message:
        "GPS is outside Ghana. Capture location while at the property in Ghana.",
    };
  }

  const detected = detectRegionFromGps(latitude, longitude);
  const regionMatch = isInsideRegion(latitude, longitude, claimedRegion);

  if (!regionMatch) {
    return {
      ok: false,
      inGhana: true,
      regionMatch: false,
      detectedRegion: detected?.name,
      message: detected
        ? `GPS places this building in ${detected.name}, but you selected ${claimedRegion}. Update the region or recapture on-site.`
        : `GPS does not match ${claimedRegion}. Recapture while at the property.`,
    };
  }

  return {
    ok: true,
    inGhana: true,
    regionMatch: true,
    detectedRegion: detected?.name ?? claimedRegion,
    message: `Location verified in ${claimedRegion}.`,
  };
}
