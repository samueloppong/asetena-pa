"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { FieldSelect } from "@/components/ui/FieldSelect";
import {
  searchGhanaLocations,
  type LocationSuggestion,
} from "@/lib/ghana-locations";
import type { FilterChip } from "@/lib/types";
import { cn } from "@/lib/utils";

export type PropertySearchValues = {
  query: string;
  filter: FilterChip;
  minBeds: string;
  minPrice: string;
  maxPrice: string;
};

interface PropertySearchProps {
  values: PropertySearchValues;
  onChange: (patch: Partial<PropertySearchValues>) => void;
  onSearch: () => void;
  onSelectLocation?: (suggestion: LocationSuggestion) => void;
}

const TYPE_OPTIONS: { value: FilterChip; label: string }[] = [
  { value: "all", label: "All Properties" },
  { value: "apartment", label: "Apartments" },
  { value: "house", label: "Houses" },
  { value: "chamber_and_hall", label: "Chamber & Hall" },
  { value: "short_stay", label: "Short Stays" },
];

const BED_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
];

export function PropertySearch({
  values,
  onChange,
  onSearch,
  onSelectLocation,
}: PropertySearchProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(
    () => searchGhanaLocations(values.query, values.query.trim() ? 10 : 8),
    [values.query]
  );

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pick(suggestion: LocationSuggestion) {
    onChange({ query: suggestion.value });
    onSelectLocation?.(suggestion);
    setOpen(false);
  }

  return (
    <PageContainer className="relative z-20 -mt-14 sm:-mt-16">
      <div
        ref={rootRef}
        className="rounded-panel border border-border bg-white p-3 shadow-[0_16px_40px_rgb(0_0_0/0.1)] sm:p-4"
      >
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_0.8fr_0.9fr_0.9fr_auto] lg:items-end">
          <label className="relative block min-w-0">
            <span className="mb-1.5 block text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Location
            </span>
            <span className="relative block">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={values.query}
                onChange={(e) => {
                  onChange({ query: e.target.value });
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setOpen(false);
                    onSearch();
                  }
                }}
                placeholder="City, neighbourhood or area"
                className="h-12 w-full rounded-button border border-border bg-background pr-3 pl-10 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/25"
                aria-label="Search Ghana locations"
              />
            </span>
            {open && suggestions.length > 0 ? (
              <ul className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-button border border-border bg-white py-1 shadow-lg">
                {suggestions.map((s) => (
                  <li key={`${s.kind}-${s.value}`}>
                    <button
                      type="button"
                      className="flex w-full flex-col px-3 py-2 text-left hover:bg-secondary"
                      onClick={() => pick(s)}
                    >
                      <span className="text-sm font-medium text-foreground">
                        {s.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {s.kind === "neighborhood"
                          ? `${s.city}, ${s.region}`
                          : s.region}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </label>

          <label className="block min-w-0">
            <span className="mb-1.5 block text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Property Type
            </span>
            <FieldSelect
              aria-label="Property type"
              value={values.filter}
              options={TYPE_OPTIONS}
              onValueChange={(filter) =>
                onChange({ filter: filter as FilterChip })
              }
            />
          </label>

          <label className="block min-w-0">
            <span className="mb-1.5 block text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Bedrooms
            </span>
            <FieldSelect
              aria-label="Minimum bedrooms"
              value={values.minBeds || "any"}
              options={BED_OPTIONS}
              onValueChange={(minBeds) =>
                onChange({ minBeds: minBeds === "any" ? "" : minBeds })
              }
            />
          </label>

          <label className="block min-w-0">
            <span className="mb-1.5 block text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Min (GH₵)
            </span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={values.minPrice}
              onChange={(e) => onChange({ minPrice: e.target.value })}
              placeholder="Min"
              className="h-12 w-full rounded-button border border-border bg-background px-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/25"
            />
          </label>

          <label className="block min-w-0">
            <span className="mb-1.5 block text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Max (GH₵)
            </span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={values.maxPrice}
              onChange={(e) => onChange({ maxPrice: e.target.value })}
              placeholder="Max"
              className="h-12 w-full rounded-button border border-border bg-background px-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/25"
            />
          </label>

          <div className="flex min-w-0 flex-col">
            <span className="mb-1.5 block text-[11px] font-semibold tracking-wide text-transparent uppercase select-none" aria-hidden>
              Search
            </span>
            <button
              type="button"
              onClick={onSearch}
              className={cn(
                "btn-gold inline-flex h-12 w-full items-center justify-center gap-2 rounded-button px-5 text-sm font-semibold transition"
              )}
            >
              <Search className="size-4" />
              Search
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
