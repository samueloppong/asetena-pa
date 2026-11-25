import {
  Bath,
  BedDouble,
  BookOpen,
  Car,
  CookingPot,
  DoorOpen,
  Flower2,
  Package,
  Sofa,
  Utensils,
  Warehouse,
  Waves,
  type LucideIcon,
} from "lucide-react";

/**
 * Components a landlord, agent or firm can drag onto the listing canvas.
 * `countable` features have a quantity (bedrooms, parking spaces…); the rest are simply on/off.
 */
export const FEATURE_KEYS = [
  "bedroom",
  "bathroom",
  "kitchen",
  "living_room",
  "garage",
  "parking",
  "garden",
  "balcony",
  "pool",
  "study_room",
  "dining_area",
  "store_room",
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

/** Saved on the listing: only features that were added, with their quantity. */
export type ListingFeatures = Partial<Record<FeatureKey, number>>;

export interface FeatureDefinition {
  key: FeatureKey;
  label: string;
  /** Singular noun for sentences, e.g. "1 Bedroom" vs "3 Bedrooms". */
  singular: string;
  plural: string;
  icon: LucideIcon;
  countable: boolean;
  max: number;
}

export const FEATURES: FeatureDefinition[] = [
  { key: "bedroom", label: "Bedroom", singular: "Bedroom", plural: "Bedrooms", icon: BedDouble, countable: true, max: 12 },
  { key: "bathroom", label: "Bathroom", singular: "Bathroom", plural: "Bathrooms", icon: Bath, countable: true, max: 12 },
  { key: "kitchen", label: "Kitchen", singular: "Kitchen", plural: "Kitchens", icon: CookingPot, countable: true, max: 4 },
  { key: "living_room", label: "Living Room", singular: "Living room", plural: "Living rooms", icon: Sofa, countable: true, max: 4 },
  { key: "garage", label: "Garage", singular: "Garage", plural: "Garages", icon: Warehouse, countable: true, max: 6 },
  { key: "parking", label: "Parking", singular: "Parking", plural: "Parking", icon: Car, countable: true, max: 20 },
  { key: "garden", label: "Garden", singular: "Garden", plural: "Garden", icon: Flower2, countable: false, max: 1 },
  { key: "balcony", label: "Balcony", singular: "Balcony", plural: "Balconies", icon: DoorOpen, countable: true, max: 6 },
  { key: "pool", label: "Pool", singular: "Pool", plural: "Pool", icon: Waves, countable: false, max: 1 },
  { key: "study_room", label: "Study Room", singular: "Study room", plural: "Study rooms", icon: BookOpen, countable: true, max: 4 },
  { key: "dining_area", label: "Dining Area", singular: "Dining area", plural: "Dining areas", icon: Utensils, countable: true, max: 4 },
  { key: "store_room", label: "Store Room", singular: "Store room", plural: "Store rooms", icon: Package, countable: true, max: 4 },
];

export const FEATURE_BY_KEY: Record<FeatureKey, FeatureDefinition> =
  Object.fromEntries(FEATURES.map((f) => [f.key, f])) as Record<
    FeatureKey,
    FeatureDefinition
  >;

export function featureCountLabel(key: FeatureKey, count: number) {
  const def = FEATURE_BY_KEY[key];
  if (!def.countable) return def.label;
  return `${count} ${count === 1 ? def.singular : def.plural}`;
}

/** Total items in the listing "cart" — every counted unit of every feature. */
export function totalFeatureUnits(features: ListingFeatures) {
  return FEATURE_KEYS.reduce((sum, key) => sum + (features[key] ?? 0), 0);
}

/** Validates unknown JSON from the DB/API into a clean feature map. */
export function parseFeatures(value: unknown): ListingFeatures {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: ListingFeatures = {};
  for (const key of FEATURE_KEYS) {
    const raw = (value as Record<string, unknown>)[key];
    if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
      out[key] = Math.min(Math.floor(raw), FEATURE_BY_KEY[key].max);
    }
  }
  return out;
}
