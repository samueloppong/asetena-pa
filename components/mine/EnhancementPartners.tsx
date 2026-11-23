"use client";

import { useMemo, useState } from "react";
import { MapPin, Phone, Shield, Sun, Zap } from "lucide-react";
import {
  ENHANCEMENT_CATEGORY_FILTERS,
  enhancementPartnersForOwner,
  type EnhancementCategory,
  type EnhancementPartner,
} from "@/lib/enhancement-partners";
import { cn } from "@/lib/utils";

export function EnhancementPartners({
  cityTown,
  neighborhood,
  region,
}: {
  cityTown?: string;
  neighborhood?: string;
  region?: string;
}) {
  const [category, setCategory] = useState<EnhancementCategory | "All">("All");

  const partners = useMemo(
    () =>
      enhancementPartnersForOwner({
        cityTown,
        neighborhood,
        region,
        category,
        limit: 6,
      }),
    [cityTown, neighborhood, region, category]
  );

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-white p-4">
      <div className="flex items-start gap-2">
        <Shield className="mt-0.5 size-4 shrink-0 text-primary" />
        <div>
          <h2 className="text-base font-bold text-brand">
            Upgrade your listings
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Companies that sell CCTV, alarms, solar, and generators — so you can
            decide what to add before tenants ask. Compare quotes; we do not take
            a cut.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ENHANCEMENT_CATEGORY_FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition",
              category === item
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-secondary/60 text-foreground hover:bg-secondary"
            )}
          >
            {item === "Solar" ? (
              <span className="inline-flex items-center gap-1">
                <Sun className="size-3" />
                Solar
              </span>
            ) : item === "Generators" ? (
              <span className="inline-flex items-center gap-1">
                <Zap className="size-3" />
                Generators
              </span>
            ) : (
              item
            )}
          </button>
        ))}
      </div>

      {partners.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No vendors in this category yet. Try All.
        </p>
      ) : (
        <ul className="space-y-3">
          {partners.map((partner) => (
            <PartnerRow key={partner.id} partner={partner} />
          ))}
        </ul>
      )}

      <p className="text-[11px] text-muted-foreground">
        Independent vendors for owner decisions. Confirm pricing, warranty, and
        installation before you buy. Mark solar or generator on the listing once
        installed.
      </p>
    </section>
  );
}

function PartnerRow({ partner }: { partner: EnhancementPartner }) {
  const mapsHref = partner.mapsQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(partner.mapsQuery)}`
    : null;

  return (
    <li className="rounded-xl border border-border/80 bg-secondary/40 px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{partner.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{partner.tagline}</p>
          <p className="mt-1.5 flex flex-wrap gap-1.5">
            {partner.categories.map((item) => (
              <span
                key={item}
                className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-foreground"
              >
                {item}
              </span>
            ))}
          </p>
          {partner.address ? (
            <p className="mt-2 flex items-start gap-1 text-xs text-muted-foreground">
              <MapPin className="mt-0.5 size-3 shrink-0 text-gold" />
              <span>
                {partner.address}
                {partner.neighborhood ? ` · ${partner.neighborhood}` : ""}
              </span>
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {partner.phone ? (
            <a
              href={`tel:${partner.phone}`}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-foreground"
            >
              <Phone className="size-3" />
              Call
            </a>
          ) : null}
          {mapsHref ? (
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
            >
              Directions
            </a>
          ) : null}
        </div>
      </div>
    </li>
  );
}
