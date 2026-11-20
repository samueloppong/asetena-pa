import {
  Car,
  Droplets,
  Fence,
  Gauge,
  Snowflake,
  Zap,
} from "lucide-react";
import type { PropertyAmenities } from "@/lib/types";
import { cn } from "@/lib/utils";

const items: {
  key: keyof PropertyAmenities;
  label: string;
  icon: typeof Droplets;
}[] = [
  { key: "has_polytank_water", label: "24/7 Water (Polytank)", icon: Droplets },
  { key: "has_standby_generator", label: "Standby Generator", icon: Zap },
  { key: "has_air_conditioning", label: "Air Conditioning", icon: Snowflake },
  { key: "is_walled_and_gated", label: "Walled & Gated", icon: Fence },
  { key: "has_self_meter", label: "Self ECG Meter", icon: Gauge },
  { key: "has_parking_space", label: "Private Parking", icon: Car },
];

interface AmenitiesGridProps {
  amenities: PropertyAmenities;
}

export function AmenitiesGrid({ amenities }: AmenitiesGridProps) {
  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {items.map(({ key, label, icon: Icon }) => {
        const available = amenities[key];
        return (
          <li
            key={key}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-3.5 py-3 text-sm",
              available
                ? "border-border bg-white text-foreground"
                : "border-transparent bg-secondary/60 text-muted-foreground line-through"
            )}
          >
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-lg",
                available ? "bg-accent text-primary" : "bg-muted text-muted-foreground"
              )}
            >
              <Icon className="size-4" />
            </span>
            {label}
          </li>
        );
      })}
    </ul>
  );
}
