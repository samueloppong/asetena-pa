import type { Property } from "@/lib/types";
import { PropertyCard } from "./PropertyCard";
import { cn } from "@/lib/utils";

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
      <div className="rounded-[1rem] border border-dashed border-border bg-white px-6 py-16 text-center">
        <p className="font-heading font-semibold text-foreground">
          No homes match your search
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try another neighbourhood or clear filters.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        columns === "single"
          ? "flex flex-col gap-4"
          : "grid grid-cols-1 gap-5 min-[640px]:grid-cols-2 lg:grid-cols-3"
      )}
    >
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}
