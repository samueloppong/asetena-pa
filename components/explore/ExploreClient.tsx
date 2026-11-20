"use client";

import { useEffect, useState } from "react";
import { SearchHeader, type HeroHome } from "@/components/search/SearchHeader";
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

interface ExploreClientProps {
  initialProperties: Property[];
  initialExperiences: Experience[];
}

export function ExploreClient({
  initialProperties,
  initialExperiences,
}: ExploreClientProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterChip>("all");
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState("Ghana");
  const [furnishing, setFurnishing] = useState<SavedSearch["furnishing"]>("");
  const [minBeds, setMinBeds] = useState("");
  const [availableBy, setAvailableBy] = useState("");
  const [billsIncluded, setBillsIncluded] = useState(false);
  const [saved, setSaved] = useState(false);

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
      !query.trim() && filter === "all" && !furnishing && !minBeds && !availableBy && !billsIncluded;
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
  }, [query, filter, furnishing, minBeds, availableBy, billsIncluded, initialProperties]);

  useEffect(() => {
    function onNew(e: Event) {
      const fresh = (e as CustomEvent<Property[]>).detail ?? [];
      if (!fresh.length) return;
      if (query.trim() || filter !== "all" || furnishing || minBeds || availableBy || billsIncluded) return;
      setProperties((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        const incoming = fresh.filter((p) => !ids.has(p.id));
        return incoming.length ? [...incoming, ...prev] : prev;
      });
    }
    window.addEventListener(NEW_LISTINGS_EVENT, onNew);
    return () => window.removeEventListener(NEW_LISTINGS_EVENT, onNew);
  }, [query, filter, furnishing, minBeds, availableBy, billsIncluded]);

  const heroHomes: HeroHome[] = initialProperties.flatMap((property) => {
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
  }).slice(0, 3);

  const featured = properties.filter(
    (p) =>
      p.is_direct_owner_verified &&
      (p.neighborhood === "Cantonments" || p.neighborhood === "East Legon") &&
      p.price_per_month >= 3500
  );

  return (
    <main>
      <SearchHeader
        query={query}
        onQueryChange={setQuery}
        locationLabel={locationLabel}
        homes={heroHomes}
        liveCount={initialProperties.length}
        onSelectSuggestion={(s) => {
          setLocationLabel(
            s.kind === "region" ? `${s.region}, GH` : `${s.value}, GH`
          );
        }}
      />

      <div className="space-y-8 px-4 pt-4 pb-8 sm:space-y-12 sm:pt-6">
        <FilterBadges active={filter} onChange={setFilter} />

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none overscroll-x-contain">
          <select
            value={furnishing}
            onChange={(e) => setFurnishing(e.target.value as SavedSearch["furnishing"])}
            className="h-11 shrink-0 rounded-xl border border-border bg-white px-3 text-base sm:text-sm"
          >
            <option value="">Any furnishing</option>
            <option value="unfurnished">Unfurnished</option>
            <option value="semi_furnished">Semi-furnished</option>
            <option value="furnished">Furnished</option>
          </select>
          <select
            value={minBeds}
            onChange={(e) => setMinBeds(e.target.value)}
            className="h-11 shrink-0 rounded-xl border border-border bg-white px-3 text-base sm:text-sm"
          >
            <option value="">Any bedrooms</option>
            <option value="1">1+ bedrooms</option>
            <option value="2">2+ bedrooms</option>
            <option value="3">3+ bedrooms</option>
          </select>
          <input
            type="date"
            value={availableBy}
            onChange={(e) => setAvailableBy(e.target.value)}
            className="h-11 shrink-0 rounded-xl border border-border bg-white px-3 text-base sm:text-sm"
            aria-label="Available by"
          />
          <label className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-border bg-white px-3 text-sm">
            <input
              type="checkbox"
              checked={billsIncluded}
              onChange={(e) => setBillsIncluded(e.target.checked)}
            />
            Bills included
          </label>
          <button
            type="button"
            className="h-11 shrink-0 rounded-xl border border-border bg-white px-3 text-sm font-medium"
            onClick={() => {
              if (saved) {
                writeSavedSearch(null);
                setSaved(false);
                return;
              }
              writeSavedSearch({ q: query, furnishing, minBeds, availableBy, billsIncluded });
              setSaved(true);
            }}
          >
            {saved ? "Saved search on" : "Save this search"}
          </button>
        </div>

        <section id="homes" className="scroll-mt-24 space-y-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.035em] text-brand sm:text-[1.65rem]">
              Verified Owner Homes
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Direct-from-owner listings — no agent inspection fees
            </p>
          </div>
          {loading ? (
            <div className="rounded-2xl border border-border bg-white px-6 py-16 text-center text-sm text-muted-foreground">
              Loading homes…
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-destructive/30 bg-white px-6 py-16 text-center text-sm text-destructive">
              {error}
            </div>
          ) : (
            <PropertyGrid properties={properties} />
          )}
        </section>

        {!loading && !query && filter === "all" && featured.length > 0 && (
          <section className="space-y-4">
            <div>
              <h2 className="text-[1.65rem] font-semibold tracking-[-0.035em] text-brand">
                Featured Executive Apartments
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Premium Accra neighborhoods
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2">
              {featured.slice(0, 2).map((property) => (
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
      </div>
    </main>
  );
}
