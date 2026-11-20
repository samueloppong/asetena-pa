import type { PaymentFrequency, PropertyType, RoomCategory } from "./types";

export function formatGhs(amount: number): string {
  const rounded = Math.round(amount);
  const body = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${rounded < 0 ? "-" : ""}₵${body}`;
}

export function formatPricePerMonth(amount: number): string {
  return `${formatGhs(amount)} / month`;
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
