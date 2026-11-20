export type ExperienceCategory =
  | "food"
  | "culture"
  | "nature"
  | "nightlife"
  | "history"
  | "market"
  | "beach"
  | "adventure";

export interface Experience {
  id: string;
  title: string;
  description: string;
  category: ExperienceCategory;
  host_name: string;
  region: string;
  city_town: string;
  neighborhood?: string;
  latitude: number;
  longitude: number;
  price_ghs: number;
  duration_hours: number;
  image_url: string;
  rating: number;
  review_count: number;
  distance_km?: number;
}
