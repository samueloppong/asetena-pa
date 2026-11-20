import type { Property } from "@/lib/types";

export const SAVED_SEARCH_KEY = "sheltergh:saved-search";

export interface SavedSearch {
  q: string;
  furnishing: "" | "unfurnished" | "semi_furnished" | "furnished";
  minBeds: string;
  availableBy: string;
  billsIncluded: boolean;
}

export function readSavedSearch(): SavedSearch | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SAVED_SEARCH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedSearch;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSavedSearch(search: SavedSearch | null) {
  if (typeof window === "undefined") return;
  if (!search) {
    localStorage.removeItem(SAVED_SEARCH_KEY);
    return;
  }
  localStorage.setItem(SAVED_SEARCH_KEY, JSON.stringify(search));
}

export function matchesSavedSearch(property: Property, search: SavedSearch) {
  if (search.q.trim()) {
    const haystack = `${property.title} ${property.neighborhood} ${property.city_town} ${property.region} ${property.description}`.toLowerCase();
    if (!haystack.includes(search.q.trim().toLowerCase())) return false;
  }
  if (search.furnishing && property.furnishing !== search.furnishing) return false;
  if (search.minBeds && property.bedrooms < Number(search.minBeds)) return false;
  if (search.availableBy) {
    if (property.available_from && property.available_from > search.availableBy) return false;
  }
  if (search.billsIncluded) {
    if (
      property.bills_electricity !== "landlord" ||
      property.bills_water !== "landlord" ||
      property.bills_internet !== "landlord"
    ) {
      return false;
    }
  }
  return true;
}
