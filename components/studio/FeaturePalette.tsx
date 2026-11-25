"use client";

import { useState } from "react";
import {
  Cigarette,
  Droplets,
  GripVertical,
  Lightbulb,
  PawPrint,
  ShieldCheck,
  Snowflake,
  Sun,
  Zap,
  Gauge,
  type LucideIcon,
} from "lucide-react";
import { ROOM_CATEGORY_LABELS } from "@/lib/format";
import {
  FEATURES,
  type FeatureKey,
  type ListingFeatures,
} from "@/lib/listing-features";
import type { PropertyAmenities, RoomCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FEATURE_MIME } from "@/components/studio/studio-state";

const PHOTO_ROOMS: RoomCategory[] = [
  "exterior",
  "living_room",
  "bedroom",
  "kitchen",
  "bathroom",
  "balcony",
];

const EXTRAS: {
  key: keyof Omit<PropertyAmenities, "has_parking_space">;
  label: string;
  icon: LucideIcon;
}[] = [
  { key: "has_polytank_water", label: "24/7 Water", icon: Droplets },
  { key: "has_standby_generator", label: "Generator", icon: Zap },
  { key: "has_solar", label: "Solar", icon: Sun },
  { key: "has_air_conditioning", label: "Air Con", icon: Snowflake },
  { key: "is_walled_and_gated", label: "Walled & Gated", icon: ShieldCheck },
  { key: "has_self_meter", label: "Prepaid Meter", icon: Gauge },
];

type Tab = "features" | "media";

export function FeaturePalette({
  features,
  onAddFeature,
  photoRoom,
  onPhotoRoom,
  amenities,
  onAmenity,
  petsAllowed,
  smokingAllowed,
  onRule,
}: {
  features: ListingFeatures;
  onAddFeature: (key: FeatureKey) => void;
  photoRoom: RoomCategory;
  onPhotoRoom: (room: RoomCategory) => void;
  amenities: PropertyAmenities;
  onAmenity: (key: keyof PropertyAmenities, value: boolean) => void;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  onRule: (key: "petsAllowed" | "smokingAllowed", value: boolean) => void;
}) {
  const [tab, setTab] = useState<Tab>("features");

  return (
    <section
      aria-label="Listing components"
      className="rounded-2xl border border-border bg-white p-4 shadow-sm"
    >
      <h2 className="text-base font-bold tracking-tight text-brand">
        <span className="lg:hidden">Add components</span>
        <span className="hidden lg:inline">Drag &amp; Drop Components</span>
      </h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        <span className="lg:hidden">
          Tap a component to add it to your listing
        </span>
        <span className="hidden lg:inline">Add features to your listing</span>
      </p>

      <div
        role="tablist"
        aria-label="Component groups"
        className="mt-3 grid grid-cols-2 gap-1 rounded-full bg-secondary p-1"
      >
        {(
          [
            ["features", "Property Features"],
            ["media", "Media & Info"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "rounded-full px-2 py-2.5 text-xs font-semibold transition lg:py-1.5 lg:text-[11px]",
              tab === id
                ? "bg-gold text-brand shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "features" ? (
        <>
          <ul className="-mx-4 mt-3 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              const count = features[feature.key] ?? 0;
              return (
                <li
                  key={feature.key}
                  className="w-[4.6rem] shrink-0 snap-start lg:w-auto"
                >
                  <button
                    type="button"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(FEATURE_MIME, feature.key);
                      e.dataTransfer.setData("text/plain", feature.label);
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    onClick={() => onAddFeature(feature.key)}
                    aria-label={`Add ${feature.label} — drag onto the listing card or tap to add`}
                    className="group relative flex aspect-square w-full cursor-grab flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-1 text-center transition hover:border-gold hover:bg-accent active:cursor-grabbing"
                  >
                    <GripVertical
                      aria-hidden
                      className="absolute top-1 right-0.5 hidden size-3 text-muted-foreground/50 lg:block"
                    />
                    {count > 0 && (
                      <span className="absolute top-1 left-1 flex min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] leading-4 font-bold text-brand">
                        {count}
                      </span>
                    )}
                    <Icon className="size-5 text-brand" strokeWidth={1.6} />
                    <span className="text-[10px] leading-tight font-medium text-foreground">
                      {feature.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 hidden gap-2.5 rounded-xl bg-secondary/70 p-3 lg:flex">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-gold-ink" />
            <div>
              <p className="text-xs font-semibold text-brand">Pro Tip</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                Drag components onto your listing card to showcase your
                property&apos;s best features.
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="mt-3 space-y-4">
          <div>
            <p className="text-xs font-semibold text-brand">Photo room</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Photos you add next are tagged as{" "}
              <span className="font-semibold text-foreground">
                {ROOM_CATEGORY_LABELS[photoRoom]}
              </span>
              .
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PHOTO_ROOMS.map((room) => (
                <button
                  key={room}
                  type="button"
                  onClick={() => onPhotoRoom(room)}
                  aria-pressed={photoRoom === room}
                  className={cn(
                    "rounded-full border px-3 py-2 text-xs font-medium transition lg:px-2.5 lg:py-1 lg:text-[11px]",
                    photoRoom === room
                      ? "border-gold bg-accent text-brand"
                      : "border-border bg-white text-muted-foreground hover:text-foreground",
                  )}
                >
                  {ROOM_CATEGORY_LABELS[room]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-brand">
              Utilities &amp; extras
            </p>
            <ul className="mt-2 grid grid-cols-2 gap-1.5 lg:grid-cols-1">
              {EXTRAS.map(({ key, label, icon: Icon }) => {
                const on = amenities[key];
                return (
                  <li key={key}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => onAmenity(key, !on)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-xl border px-3 py-3 text-left text-xs font-medium transition lg:py-2",
                        on
                          ? "border-gold bg-accent text-brand"
                          : "border-border bg-white text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Icon className="size-4" strokeWidth={1.7} />
                      {label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-brand">House rules</p>
            <ul className="mt-2 grid grid-cols-2 gap-1.5 lg:grid-cols-1">
              {(
                [
                  ["petsAllowed", "Pets allowed", PawPrint, petsAllowed],
                  [
                    "smokingAllowed",
                    "Smoking allowed",
                    Cigarette,
                    smokingAllowed,
                  ],
                ] as const
              ).map(([key, label, Icon, on]) => (
                <li key={key}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => onRule(key, !on)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl border px-3 py-3 text-left text-xs font-medium transition lg:py-2",
                      on
                        ? "border-gold bg-accent text-brand"
                        : "border-border bg-white text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" strokeWidth={1.7} />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
