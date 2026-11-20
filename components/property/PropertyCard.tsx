"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Heart, MapPin, ShieldCheck, Star } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Property } from "@/lib/types";
import {
  ADVANCE_LABELS,
  formatLocation,
  formatPricePerMonth,
  PROPERTY_TYPE_LABELS,
} from "@/lib/format";
import { fetchFavorites, toggleFavoriteApi } from "@/lib/api-client";
import { isJustAdded } from "@/lib/just-added";
import { cn } from "@/lib/utils";
import { PropertyImage } from "@/components/property/PropertyImage";

const FURNISHING_LABEL = {
  unfurnished: "Unfurnished",
  semi_furnished: "Semi-furnished",
  furnished: "Furnished",
} as const;

interface PropertyCardProps {
  property: Property;
  compact?: boolean;
}

export function PropertyCard({ property, compact = false }: PropertyCardProps) {
  const photos = useMemo(() => {
    const sorted = property.media
      .slice()
      .sort((a, b) => a.display_order - b.display_order);
    const exteriorFirst = [
      ...sorted.filter((m) => m.category === "exterior"),
      ...sorted.filter((m) => m.category !== "exterior"),
    ];
    return exteriorFirst;
  }, [property.media]);

  const { status } = useSession();
  const router = useRouter();
  const [favorited, setFavorited] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [justAdded, setJustAdded] = useState(false);
  const cover = photos[photoIndex] ?? photos[0];

  useEffect(() => {
    setPhotoIndex(0);
  }, [property.id]);

  useEffect(() => {
    setJustAdded(isJustAdded(property.created_at));
  }, [property.created_at]);

  useEffect(() => {
    if (status !== "authenticated") {
      setFavorited(false);
      return;
    }
    fetchFavorites()
      .then((data) => setFavorited(data.ids.includes(property.id)))
      .catch(() => setFavorited(false));
  }, [property.id, status]);

  async function onHeartClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (status !== "authenticated") {
      toast.message("Sign in to save homes");
      router.push("/login");
      return;
    }
    try {
      const next = await toggleFavoriteApi(property.id, favorited);
      setFavorited(next);
    } catch {
      toast.error("Could not update favorite");
    }
  }

  function shiftPhoto(e: React.MouseEvent, delta: number) {
    e.preventDefault();
    e.stopPropagation();
    if (photos.length < 2) return;
    setPhotoIndex((i) => (i + delta + photos.length) % photos.length);
  }

  return (
    <Link
      href={`/properties/${property.id}`}
      className={cn(
        "listing-card group flex overflow-hidden",
        compact ? "flex-col rounded-2xl" : "flex-row rounded-[1.25rem]"
      )}
    >
      <div
        className={cn(
          "relative shrink-0 overflow-hidden bg-secondary",
          compact
            ? "aspect-[4/3]"
            : "aspect-auto w-[38%] min-h-36 sm:w-[42%] sm:min-h-56"
        )}
      >
        {cover && (
          <PropertyImage
            src={cover.media_url}
            alt={property.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        )}
        <div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-1.5">
          {justAdded && (
            <span className="inline-flex items-center rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold tracking-wide text-primary-foreground uppercase shadow-sm">
              Just added
            </span>
          )}
          {property.is_direct_owner_verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-verified px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm">
              <ShieldCheck className="size-3" />
              Verified Owner
            </span>
          )}
        </div>
        <button
          type="button"
          aria-label={favorited ? "Remove from favorites" : "Save to favorites"}
          onClick={onHeartClick}
          className="absolute top-3 right-3 z-10 flex size-9 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm backdrop-blur transition hover:scale-105"
        >
          <Heart
            className={cn(
              "size-4",
              favorited && "fill-red-500 text-red-500"
            )}
          />
        </button>

        {photos.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={(e) => shiftPhoto(e, -1)}
              className="absolute top-1/2 left-2 z-10 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-90 backdrop-blur transition hover:bg-black/55 sm:flex"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={(e) => shiftPhoto(e, 1)}
              className="absolute top-1/2 right-2 z-10 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-90 backdrop-blur transition hover:bg-black/55 sm:flex"
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        )}
        {photos.length > 0 && (
          <span className="absolute bottom-2 right-2 z-10 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white">
            {photoIndex + 1}/{photos.length}
          </span>
        )}
      </div>

      <div className={cn("flex min-w-0 flex-1 flex-col", compact ? "gap-1 p-3" : "gap-1 p-3 sm:gap-1.5 sm:p-4")}>
        <div className="flex items-start justify-between gap-2">
          <p className={cn("font-bold tracking-[-0.03em] text-brand", compact ? "text-sm" : "text-base sm:text-xl")}>
            {formatPricePerMonth(property.price_per_month)}
          </p>
          <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium">
            <Star className="size-3.5 fill-rating text-rating" />
            {property.review_count > 0 ? property.rating.toFixed(1) : "New"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{ADVANCE_LABELS[property.advance_period]}</p>
        <p className="flex items-center gap-1 text-sm font-medium text-foreground">
          <MapPin className="size-3.5 shrink-0 text-primary" />
          <span className="truncate">{formatLocation(property.neighborhood, property.city_town)}</span>
        </p>
        <h3 className="line-clamp-1 text-sm font-semibold leading-snug text-foreground">
          {property.title}
        </h3>
        <p className="text-xs text-muted-foreground">
          {`${property.bedrooms} ${property.bedrooms === 1 ? "bed" : "beds"} · ${property.bathrooms} ${property.bathrooms === 1 ? "bath" : "baths"} · ${PROPERTY_TYPE_LABELS[property.property_type]} · ${FURNISHING_LABEL[property.furnishing]}`}
        </p>
        {!compact && (
          <p className="line-clamp-2 hidden text-sm leading-relaxed text-muted-foreground sm:block">
            {property.description}
          </p>
        )}
      </div>
    </Link>
  );
}
