"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, Star } from "lucide-react";
import type { Experience } from "@/lib/experience-types";
import { formatGhs } from "@/lib/format";

const CATEGORY_LABELS: Record<Experience["category"], string> = {
  food: "Food",
  culture: "Culture",
  nature: "Nature",
  nightlife: "Nightlife",
  history: "History",
  market: "Market",
  beach: "Beach",
  adventure: "Adventure",
};

interface ExperienceCardProps {
  experience: Experience;
}

export function ExperienceCard({ experience }: ExperienceCardProps) {
  return (
    <Link
      href={`/experiences/${experience.id}`}
      className="group w-[220px] shrink-0 overflow-hidden rounded-2xl border border-border/80 bg-white shadow-sm transition hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/3] bg-secondary">
        <Image
          src={experience.image_url}
          alt={experience.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="220px"
          unoptimized={experience.image_url.startsWith("/")}
        />
        <span className="absolute top-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-foreground backdrop-blur">
          {CATEGORY_LABELS[experience.category]}
        </span>
      </div>
      <div className="space-y-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
            {experience.title}
          </h3>
          <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium">
            <Star className="size-3 fill-rating text-rating" />
            {experience.rating.toFixed(1)}
          </span>
        </div>
        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="size-3 shrink-0" />
          {experience.neighborhood
            ? `${experience.neighborhood}, ${experience.city_town}`
            : experience.city_town}
          {experience.distance_km != null
            ? ` · ${experience.distance_km} km`
            : ""}
        </p>
        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="size-3" />
          {experience.duration_hours}h · From {formatGhs(experience.price_ghs)}
        </p>
      </div>
    </Link>
  );
}
