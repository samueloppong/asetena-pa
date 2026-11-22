"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { HeroSection, type HeroHome } from "@/components/home/HeroSection";
import { PropertySearch } from "@/components/home/PropertySearch";
import { Footer } from "@/components/layout/Footer";
import { PageContainer } from "@/components/layout/PageContainer";
import { FieldSelect } from "@/components/ui/FieldSelect";
import { formatPricePerMonth } from "@/lib/format";
import { FilterBadges } from "@/components/search/FilterBadges";
import { PropertyGrid } from "@/components/property/PropertyGrid";
import { PropertyCard } from "@/components/property/PropertyCard";
import { ExperiencesNearby } from "@/components/experience/ExperiencesNearby";
import { fetchProperties } from "@/lib/api-client";
import { NEW_LISTINGS_EVENT } from "@/lib/use-new-listing-alerts";
import { readSavedSearch, writeSavedSearch, type SavedSearch } from "@/lib/saved-search";
import type { Experience } from "@/lib/experience-types";
import type { FilterChip, Property } from "@/lib/types";

type SortMode = "latest" | "price_asc" | "price_desc";

interface ExploreClientProps {
  initialProperties: Property[];
  initialExperiences: Experience[];
}

function isFilterChip(value: string | null): value is FilterChip {
  return (
    value === "all" ||
    value === "apartment" ||
    value === "house" ||
    value === "chamber_and_hall" ||
    value === "short_stay" ||
    value === "verified"
  );
}

export function ExploreClient({
  initialProperties,
  initialExperiences,
}: ExploreClientProps) {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterChip>(
    isFilterChip(typeParam) ? typeParam : "all"
  );
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState("Ghana");
  const [furnishing, setFurnishing] = useState<SavedSearch["furnishing"]>("");
  const [minBeds, setMinBeds] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [availableBy, setAvailableBy] = useState("");
  const [billsIncluded, setBillsIncluded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sort, setSort] = useState<SortMode>("latest");
  const [searchTick, setSearchTick] = useState(0);

  useEffect(() => {
    if (isFilterChip(typeParam)) setFilter(typeParam);
  }, [typeParam]);

  useEffect(() => {
    const existing = readSavedSearch();
    if (!existing) return;
    setQuery(existing.q ?? "");
    setFurnishing(existing.furnishing ?? "");
    setMinBeds(existing.minBeds ?? "");
    setAvailableBy(existing.availableBy ?? "");
    setBillsIncluded(Boolean(existing.billsIncluded));
    setSaved(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const isDefault =
      !query.trim() &&
      filter === "all" &&
      !furnishing &&
      !minBeds &&
      !availableBy &&
      !billsIncluded &&
      !minPrice &&
      !maxPrice;

    if (isDefault) {
      setProperties(initialProperties);
      setError(null);
      setLoading(false);
      return;
    }

    const handle = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchProperties({
          q: query,
          filter,
          furnishing,
          minBeds,
          availableBy,
          billsIncluded,
          minPrice,
          maxPrice,
        });
        if (!cancelled) setProperties(data);
      } catch {
        if (!cancelled) setError("Could not load listings. Check your connection.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [
    query,
    filter,
    furnishing,
    minBeds,
    availableBy,
    billsIncluded,
    minPrice,
    maxPrice,
    initialProperties,
    searchTick,
  ]);

  useEffect(() => {
    function onNew(e: Event) {
      const fresh = (e as CustomEvent<Property[]>).detail ?? [];
      if (!fresh.length) return;
      if (
        query.trim() ||
        filter !== "all" ||
        furnishing ||
        minBeds ||
        availableBy ||
        billsIncluded ||
        minPrice ||
        maxPrice
      ) {
        return;
      }
      setProperties((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        const incoming = fresh.filter((p) => !ids.has(p.id));
        return incoming.length ? [...incoming, ...prev] : prev;
      });
    }
    window.addEventListener(NEW_LISTINGS_EVENT, onNew);
    return () => window.removeEventListener(NEW_LISTINGS_EVENT, onNew);
  }, [
    query,
    filter,
    furnishing,
    minBeds,
    availableBy,
    billsIncluded,
    minPrice,
    maxPrice,
  ]);

  const heroHomes: HeroHome[] = initialProperties
    .flatMap((property) => {
      const image = property.media.find((item) => item.media_type === "image");
      if (!image) return [];
      return [
        {
          id: property.id,
          title: property.title,
          place: `${property.neighborhood}, ${property.city_town}`,
          priceLabel: formatPricePerMonth(property.price_per_month),
          imageUrl: image.media_url,
        },
      ];
    })
    .slice(0, 3);

  const sortedProperties = useMemo(() => {
    const list = [...properties];
    if (sort === "price_asc") {
      list.sort((a, b) => a.price_per_month - b.price_per_month);
    } else if (sort === "price_desc") {
      list.sort((a, b) => b.price_per_month - a.price_per_month);
    } else {
      list.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    return list;
  }, [properties, sort]);

  const featured = properties
    .filter(
      (p) =>
        p.is_active &&
        p.availability === "available" &&
        p.price_per_month >= 3500 &&
        (p.property_type === "apartment" ||
          p.property_type === "house" ||
          p.property_type === "short_stay") &&
        (p.neighborhood === "Cantonments" ||
          p.neighborhood === "East Legon" ||
          p.neighborhood === "Airport Residential" ||
          p.neighborhood === "Osu")
    )
    .sort((a, b) => b.price_per_month - a.price_per_month);

  function clearFilters() {
    setQuery("");
    setFilter("all");
    setFurnishing("");
    setMinBeds("");
    setMinPrice("");
    setMaxPrice("");
    setAvailableBy("");
    setBillsIncluded(false);
    setSort("latest");
  }

  return (
    <main>
      <HeroSection homes={heroHomes} liveCount={initialProperties.length} />

      <PropertySearch
        values={{ query, filter, minBeds, minPrice, maxPrice }}
        onChange={(patch) => {
          if (patch.query !== undefined) setQuery(patch.query);
          if (patch.filter !== undefined) setFilter(patch.filter);
          if (patch.minBeds !== undefined) setMinBeds(patch.minBeds);
          if (patch.minPrice !== undefined) setMinPrice(patch.minPrice);
          if (patch.maxPrice !== undefined) setMaxPrice(patch.maxPrice);
        }}
        onSearch={() => {
          setSearchTick((n) => n + 1);
          document.getElementById("homes")?.scrollIntoView({ behavior: "smooth" });
        }}
        onSelectLocation={(s) => {
          setLocationLabel(
            s.kind === "region" ? `${s.region}, GH` : `${s.value}, GH`
          );
        }}
      />

      <PageContainer className="space-y-8 pt-8 pb-8 sm:space-y-10 sm:pt-10">
        <FilterBadges active={filter} onChange={setFilter} />

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none overscroll-x-contain sm:mx-0 sm:px-0">
          {(
            [
              ["", "Any furnishing"],
              ["furnished", "Furnished"],
              ["semi_furnished", "Part furnished"],
              ["unfurnished", "Unfurnished"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value || "any"}
              type="button"
              onClick={() => setFurnishing(value)}
              className={
                furnishing === value
                  ? "h-11 shrink-0 rounded-[0.75rem] border border-primary bg-accent px-3 text-sm font-semibold text-foreground"
                  : "h-11 shrink-0 rounded-[0.75rem] border border-border bg-white px-3 text-sm text-foreground"
              }
            >
              {label}
            </button>
          ))}
          <input
            type="date"
            value={availableBy}
            onChange={(e) => setAvailableBy(e.target.value)}
            className="h-11 shrink-0 rounded-[0.75rem] border border-border bg-white px-3 text-sm"
            aria-label="Available by"
          />
          <label className="flex h-11 shrink-0 items-center gap-2 rounded-[0.75rem] border border-border bg-white px-3 text-sm">
            <input
              type="checkbox"
              checked={billsIncluded}
              onChange={(e) => setBillsIncluded(e.target.checked)}
            />
            Bills included
          </label>
          <button
            type="button"
            className="h-11 shrink-0 rounded-[0.75rem] border border-border bg-white px-3 text-sm font-medium"
            onClick={() => {
              if (saved) {
                writeSavedSearch(null);
                setSaved(false);
                return;
              }
              writeSavedSearch({
                q: query,
                furnishing,
                minBeds,
                availableBy,
                billsIncluded,
              });
              setSaved(true);
            }}
          >
            {saved ? "Saved search on" : "Save this search"}
          </button>
          <button
            type="button"
            className="h-11 shrink-0 rounded-[0.75rem] border border-border bg-white px-3 text-sm font-medium text-muted-foreground"
            onClick={clearFilters}
          >
            Clear all
          </button>
        </div>

        <section id="homes" className="scroll-mt-28 space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-heading text-2xl font-bold tracking-[-0.035em] text-brand sm:text-[1.85rem]">
                Find your next home
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Explore verified properties available directly from owners
                {locationLabel !== "Ghana" ? ` · ${locationLabel}` : ""}.
                {!loading ? ` ${sortedProperties.length} matches.` : null}
              </p>
            </div>
            <label className="flex min-w-[12rem] items-center gap-2 text-sm">
              <span className="shrink-0 text-muted-foreground">Sort</span>
              <FieldSelect
                aria-label="Sort listings"
                size="sm"
                value={sort}
                triggerClassName="bg-white"
                options={[
                  { value: "latest", label: "Latest" },
                  { value: "price_asc", label: "Price: Low to High" },
                  { value: "price_desc", label: "Price: High to Low" },
                ]}
                onValueChange={(value) => setSort(value as SortMode)}
              />
            </label>
          </div>

          {loading ? (
            <div className="rounded-[1rem] border border-border bg-white px-6 py-16 text-center text-sm text-muted-foreground">
              Loading homes…
            </div>
          ) : error ? (
            <div className="rounded-[1rem] border border-destructive/30 bg-white px-6 py-16 text-center text-sm text-destructive">
              {error}
            </div>
          ) : (
            <PropertyGrid properties={sortedProperties} />
          )}
        </section>

        {!loading && !query && filter === "all" && featured.length > 0 && (
          <section className="space-y-4">
            <div>
              <h2 className="font-heading text-[1.65rem] font-bold tracking-[-0.035em] text-brand">
                Featured Executive Apartments
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Premium Accra neighbourhoods
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 min-[640px]:grid-cols-2 lg:grid-cols-3">
              {featured.slice(0, 3).map((property) => (
                <PropertyCard
                  key={`feat-${property.id}`}
                  property={property}
                  compact
                />
              ))}
            </div>
          </section>
        )}

        <ExperiencesNearby
          initialExperiences={initialExperiences}
          searchQuery={query}
        />
      </PageContainer>

      <Footer />
    </main>
  );
}
