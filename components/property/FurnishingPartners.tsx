import { MapPin, Phone, Sofa } from "lucide-react";
import {
  needsFurnishingHelp,
  partnersForListing,
  type FurnishingPartner,
} from "@/lib/furnishing-partners";
import type { Furnishing } from "@/lib/types";

export function FurnishingPartners({
  furnishing,
  region,
  cityTown,
  neighborhood,
}: {
  furnishing: Furnishing;
  region: string;
  cityTown: string;
  neighborhood: string;
}) {
  if (!needsFurnishingHelp(furnishing)) return null;

  const partners = partnersForListing({ region, cityTown, neighborhood });
  if (partners.length === 0) return null;

  const isSemi = furnishing === "semi_furnished";

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-white p-4">
      <div className="flex items-start gap-2">
        <Sofa className="mt-0.5 size-4 shrink-0 text-primary" />
        <div>
          <h2 className="text-base font-bold text-brand">Where to furnish</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {isSemi
              ? "This home is only partly furnished. These shops near the area can help you complete the setup."
              : "This home is unfurnished. These shops near the area sell beds, sofas, and starter kits for new tenants."}
          </p>
        </div>
      </div>
      <ul className="space-y-3">
        {partners.map((partner) => (
          <PartnerRow key={partner.id} partner={partner} />
        ))}
      </ul>
      <p className="text-[11px] text-muted-foreground">
        Independent shops shown to help renters — not the landlord. Confirm
        stock and delivery before you buy.
      </p>
    </section>
  );
}

function PartnerRow({ partner }: { partner: FurnishingPartner }) {
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
            {partner.categories.map((category) => (
              <span
                key={category}
                className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-foreground"
              >
                {category}
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
