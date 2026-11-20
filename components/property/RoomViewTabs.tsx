"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PropertyMedia, RoomCategory } from "@/lib/types";
import { ROOM_CATEGORY_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PropertyImage } from "@/components/property/PropertyImage";

interface RoomViewTabsProps {
  media: PropertyMedia[];
  title: string;
}

export function RoomViewTabs({ media, title }: RoomViewTabsProps) {
  const orderedMedia = useMemo(
    () =>
      media.slice().sort((a, b) => {
        if (a.display_order !== b.display_order) {
          return a.display_order - b.display_order;
        }
        return a.category.localeCompare(b.category);
      }),
    [media]
  );

  const categories = useMemo(() => {
    const order: RoomCategory[] = [
      "living_room",
      "bedroom",
      "kitchen",
      "bathroom",
      "balcony",
      "exterior",
      "street_view",
    ];
    return order.filter((cat) => orderedMedia.some((m) => m.category === cat));
  }, [orderedMedia]);

  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setIndex(0);
  }, [orderedMedia]);

  const safeIndex =
    orderedMedia.length === 0
      ? 0
      : ((index % orderedMedia.length) + orderedMedia.length) %
        orderedMedia.length;
  const current = orderedMedia[safeIndex];
  const active = current?.category ?? categories[0] ?? "living_room";

  function go(delta: number) {
    if (orderedMedia.length < 2) return;
    setIndex((i) => (i + delta + orderedMedia.length) % orderedMedia.length);
  }

  function selectCategory(cat: RoomCategory) {
    const first = orderedMedia.findIndex((m) => m.category === cat);
    if (first >= 0) setIndex(first);
  }

  if (!current) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center bg-secondary text-sm text-muted-foreground sm:rounded-2xl">
        No photos yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className="relative aspect-[4/3] overflow-hidden bg-secondary sm:aspect-[16/10] sm:rounded-2xl"
        onTouchStart={(e) => {
          touchStartX.current = e.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current == null) return;
          const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
          const delta = endX - touchStartX.current;
          touchStartX.current = null;
          if (Math.abs(delta) < 40) return;
          go(delta < 0 ? 1 : -1);
        }}
      >
        <PropertyImage
          src={current.media_url}
          alt={`${title} — ${ROOM_CATEGORY_LABELS[active]}`}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />

        {orderedMedia.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => go(-1)}
              className="absolute top-1/2 left-3 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-sm backdrop-blur transition hover:bg-black/60"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => go(1)}
              className="absolute top-1/2 right-3 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-sm backdrop-blur transition hover:bg-black/60"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}

        <div className="absolute right-3 bottom-3 z-10 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur">
          {safeIndex + 1}/{orderedMedia.length} · {ROOM_CATEGORY_LABELS[active]}
        </div>

        {orderedMedia.length > 1 && (
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {orderedMedia.map((m, i) => (
              <button
                key={m.id}
                type="button"
                aria-label={`Go to photo ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "size-1.5 rounded-full transition",
                  i === safeIndex ? "bg-white" : "bg-white/40"
                )}
              />
            ))}
          </div>
        )}
      </div>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex w-max gap-2" role="tablist" aria-label="Room views">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={active === cat}
              onClick={() => selectCategory(cat)}
              className={cn(
                "rounded-full px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors",
                active === cat
                  ? "bg-foreground text-white"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {ROOM_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
