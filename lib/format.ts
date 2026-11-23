import type {
  Furnishing,
  PaymentFrequency,
  PropertyType,
  RoomCategory,
  StayDuration,
} from "./types";

export function formatGhs(amount: number): string {
  const rounded = Math.round(amount);
  const body = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${rounded < 0 ? "-" : ""}₵${body}`;
}

export function formatPricePerMonth(amount: number): string {
  return `${formatGhs(amount)} pcm`;
}

export const ADVANCE_LABELS: Record<PaymentFrequency, string> = {
  monthly: "Monthly",
  six_months: "6 Months Advance",
  one_year: "1 Year Advance",
  two_years: "2 Years Advance",
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: "Apartment",
  house: "House",
  chamber_and_hall: "Chamber & Hall",
  single_room: "Single Room",
  short_stay: "Short-stay",
};

export const FURNISHING_LABELS: Record<Furnishing, string> = {
  unfurnished: "Unfurnished",
  semi_furnished: "Part furnished",
  furnished: "Furnished",
};

export const STAY_DURATION_LABELS: Record<StayDuration, string> = {
  long_stay: "Long stay",
  short_stay: "Short stay",
};

export const STAY_DURATION_OPTIONS: {
  value: StayDuration;
  label: string;
}[] = [
  { value: "long_stay", label: STAY_DURATION_LABELS.long_stay },
  { value: "short_stay", label: STAY_DURATION_LABELS.short_stay },
];

export const FURNISHING_OPTIONS: { value: Furnishing; label: string }[] = [
  { value: "furnished", label: FURNISHING_LABELS.furnished },
  { value: "semi_furnished", label: FURNISHING_LABELS.semi_furnished },
  { value: "unfurnished", label: FURNISHING_LABELS.unfurnished },
];

/** Prefer stored max; fall back so every listing can still show a guest cap. */
export function maxPersonsLabel(
  maxOccupants: number | null | undefined,
  bedrooms: number
): string {
  const max =
    maxOccupants && maxOccupants > 0
      ? maxOccupants
      : Math.max(1, bedrooms * 2 || 1);
  return `Up to ${max} ${max === 1 ? "person" : "persons"}`;
}

export function smokingRuleLabel(smokingAllowed: boolean): string {
  return smokingAllowed ? "Smoking allowed" : "No smoking";
}

/** Card meta line — beds, baths, type, guests, smoking (furnishing is a separate chip). */
export function listingStayFacts(input: {
  bedrooms: number;
  bathrooms: number;
  propertyType: PropertyType;
  maxOccupants?: number | null;
  smokingAllowed: boolean;
}): string[] {
  return [
    `${input.bedrooms} ${input.bedrooms === 1 ? "bed" : "beds"}`,
    `${input.bathrooms} ${input.bathrooms === 1 ? "bath" : "baths"}`,
    PROPERTY_TYPE_LABELS[input.propertyType],
    maxPersonsLabel(input.maxOccupants, input.bedrooms),
    smokingRuleLabel(input.smokingAllowed),
  ];
}

export const ROOM_CATEGORY_LABELS: Record<RoomCategory, string> = {
  living_room: "Living Room",
  bedroom: "Bedroom",
  kitchen: "Kitchen",
  bathroom: "Bathroom",
  balcony: "Balcony",
  exterior: "Exterior",
  street_view: "Street View",
};

export function formatLocation(
  neighborhood: string,
  cityTown: string
): string {
  return `${neighborhood}, ${cityTown}`;
}
