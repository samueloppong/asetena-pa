"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MapPin, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { PropertyImage } from "@/components/property/PropertyImage";
import {
  searchGhanaLocations,
  type LocationSuggestion,
} from "@/lib/ghana-locations";
import { cn } from "@/lib/utils";

export type HeroHome = {
  id: string;
  title: string;
  place: string;
  priceLabel: string;
  imageUrl: string;
};

interface SearchHeaderProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSelectSuggestion?: (suggestion: LocationSuggestion) => void;
  locationLabel?: string;
  homes?: HeroHome[];
  liveCount?: number;
}

const PLACES: LocationSuggestion[] = [
  { label: "Accra", value: "Accra", kind: "city", region: "Greater Accra", city: "Accra" },
  { label: "East Legon", value: "East Legon", kind: "neighborhood", region: "Greater Accra", city: "Accra" },
  { label: "Osu", value: "Osu", kind: "neighborhood", region: "Greater Accra", city: "Accra" },
  { label: "Kumasi", value: "Kumasi", kind: "city", region: "Ashanti", city: "Kumasi" },
  { label: "Spintex", value: "Spintex", kind: "neighborhood", region: "Greater Accra", city: "Accra" },
  { label: "Tema", value: "Tema", kind: "city", region: "Greater Accra", city: "Tema" },
];

export function SearchHeader({
  query,
  onQueryChange,
  onSelectSuggestion,
  locationLabel = "Ghana",
  homes = [],
  liveCount = 0,
}: SearchHeaderProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const stage = homes.slice(0, 3);

  const suggestions = useMemo(
    () => searchGhanaLocations(query, query.trim() ? 14 : 16),
    [query]
  );

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pick(suggestion: LocationSuggestion) {
    onQueryChange(suggestion.value);
    onSelectSuggestion?.(suggestion);
    setOpen(false);
  }

  return (
    <header className="relative">
      <div
        className="pointer-events-none absolute inset-y-0 left-1/2 -z-10 w-[100vw] -translate-x-1/2 bg-[#120e0c]"
        aria-hidden
      />
      <div className="relative overflow-hidden bg-[#120e0c] text-white">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="hero-adinkra-cloth absolute -inset-[8%]" />
          <div className="hero-adinkra-veil absolute inset-0" />
          <div className="hero-grain absolute inset-0" />
          <div className="absolute -top-24 right-[-8%] h-[22rem] w-[22rem] rounded-full bg-[#e39b4a]/28 blur-3xl" />
          <div className="absolute bottom-[-8rem] left-[-6%] h-72 w-72 rounded-full bg-[#1f6f6a]/22 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-5xl gap-8 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-20 sm:pt-7 sm:pb-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-end lg:gap-10 lg:pt-8 lg:pb-32">
          <div className="relative min-w-0">
            <div
              className="pointer-events-none absolute -inset-x-4 -top-3 -bottom-6 -z-10 overflow-hidden rounded-[1.75rem] border border-[#f6d38a]/20 shadow-[inset_0_1px_0_rgb(255_255_255/0.1),0_20px_50px_rgb(0_0_0/0.25)] sm:-inset-x-6 sm:-top-5 sm:-bottom-8"
              aria-hidden
            >
              <div className="hero-adinkra-cloth-panel absolute inset-0" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#120e0c]/68 via-[#120e0c]/25 to-[#120e0c]/40" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <BrandLogo compact priority tone="light" />
              <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium text-white backdrop-blur-md">
                <MapPin className="size-3.5 text-[#f6d38a]" />
                {locationLabel}
              </div>
            </div>

            <h1 className="mt-8 max-w-lg font-heading text-[2.35rem] leading-[0.98] font-bold tracking-[-0.05em] text-white sm:mt-12 sm:text-5xl lg:text-[3.75rem]">
              Rent with
              <span className="mt-1 block bg-gradient-to-r from-[#fff6d8] via-[#f6d38a] to-[#e08a3c] bg-clip-text text-transparent">
                accountability.
              </span>
            </h1>
            <p className="mt-3 max-w-sm text-sm text-white/70 sm:text-[0.95rem]">
              Homes from landlords and agents across Ghana.
              {liveCount > 0
                ? ` ${liveCount} live now.`
                : null}
            </p>

            <Link
              href="/post"
              className="mt-6 inline-flex h-14 w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-[#f6d38a] px-7 text-base font-bold tracking-[-0.02em] text-[#120e0c] shadow-[0_14px_40px_rgb(246_211_138/0.35)] transition hover:bg-[#ffe4a8] hover:shadow-[0_18px_44px_rgb(246_211_138/0.45)] active:translate-y-px sm:w-auto"
            >
              <Plus className="size-5" strokeWidth={2.75} />
              List a home
            </Link>

            <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none overscroll-x-contain sm:mx-0 sm:px-0">
              {PLACES.map((place) => {
                const active = query.trim().toLowerCase() === place.value.toLowerCase();
                return (
                  <button
                    key={place.value}
                    type="button"
                    onClick={() => pick(place)}
                    className={cn(
                      "inline-flex h-10 shrink-0 items-center rounded-full px-3.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-white text-[#120e0c]"
                        : "bg-white/10 text-white hover:bg-white/20"
                    )}
                    aria-pressed={active}
                  >
                    {place.label}
                  </button>
                );
              })}
            </div>
          </div>

          {stage.length > 0 ? (
            <div className="relative hidden h-[26rem] lg:block">
              {stage.map((home, index) => (
                <Link
                  key={home.id}
                  href={`/properties/${home.id}`}
                  className={cn(
                    "group absolute block overflow-hidden rounded-[1.35rem] border border-white/20 shadow-[0_24px_60px_rgb(0_0_0/0.45)]",
                    index === 0 && "top-6 right-0 z-20 h-72 w-[78%] rotate-2",
                    index === 1 && "bottom-4 left-0 z-30 h-52 w-[58%] -rotate-6",
                    index === 2 && "top-0 left-6 z-10 h-40 w-[46%] rotate-3"
                  )}
                  aria-label={`${home.title}, ${home.place}, ${home.priceLabel}`}
                >
                  <span
                    className="hero-float block h-full w-full"
                    style={{ animationDelay: `${index * 0.8}s` }}
                  >
                    <span className="relative block h-full w-full overflow-hidden">
                      <PropertyImage
                        src={home.imageUrl}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 360px, 0px"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-3 pt-10 pb-3">
                        <span className="block text-[11px] font-medium tracking-wide text-white/80 uppercase">
                          {home.place}
                        </span>
                        <span className="mt-0.5 block text-sm font-semibold text-white">
                          {home.priceLabel}
                        </span>
                      </span>
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="sticky top-0 z-40 -mt-14 sm:-mt-16">
        <div ref={rootRef} className="relative mx-auto max-w-5xl px-4 pb-2">
          <label className="relative block">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                onQueryChange(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="City or neighborhood"
              className="h-12 rounded-2xl border-white/70 bg-white pl-11 text-base shadow-[0_18px_50px_rgb(0_0_0/0.28)] sm:h-14"
              aria-label="Search Ghana locations"
              aria-autocomplete="list"
              aria-expanded={open}
              autoComplete="off"
            />
          </label>

          {open && suggestions.length > 0 && (
            <ul
              role="listbox"
              className="absolute right-4 left-4 z-50 mt-2 max-h-72 overflow-auto rounded-2xl border border-border bg-white py-2 shadow-lg"
            >
              {!query.trim() && (
                <li className="px-4 pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  All 16 regions
                </li>
              )}
              {suggestions.map((s) => (
                <li key={`${s.kind}-${s.region}-${s.value}`}>
                  <button
                    type="button"
                    role="option"
                    className="flex w-full items-start gap-2 px-4 py-2.5 text-left text-sm hover:bg-accent"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(s)}
                  >
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    <span>
                      <span className="font-medium text-foreground">{s.label}</span>
                      <span className="mt-0.5 block text-[11px] capitalize text-muted-foreground">
                        {s.kind}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </header>
  );
}
