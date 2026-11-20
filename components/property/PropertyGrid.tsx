import type { Property } from "@/lib/types";
import { PropertyCard } from "./PropertyCard";

interface PropertyGridProps {
  properties: Property[];
  columns?: "single" | "responsive";
}

export function PropertyGrid({
  properties,
  columns = "responsive",
}: PropertyGridProps) {
  if (properties.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white/70 px-6 py-16 text-center">
        <p className="font-medium text-foreground">No homes match your search</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try another neighborhood or clear filters.
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        columns === "single" ? "flex flex-col gap-4" : "flex flex-col gap-4"
      }
    >
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}
