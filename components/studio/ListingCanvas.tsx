"use client";

import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  CloudUpload,
  Heart,
  ImagePlus,
  Loader2,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  Star,
  Trash2,
} from "lucide-react";
import { PropertyImage } from "@/components/property/PropertyImage";
import {
  FEATURES,
  FEATURE_BY_KEY,
  featureCountLabel,
  type FeatureKey,
  type ListingFeatures,
} from "@/lib/listing-features";
import { STAY_DURATION_LABELS } from "@/lib/format";
import type { StayDuration } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  FEATURE_MIME,
  MAX_PHOTOS,
  type StudioPhoto,
} from "@/components/studio/studio-state";

export type PendingPhoto = { id: string; preview: string };

type DragKind = "feature" | "files" | null;

function dragKindOf(e: DragEvent): DragKind {
  const types = Array.from(e.dataTransfer.types);
  if (types.includes(FEATURE_MIME)) return "feature";
  if (types.includes("Files")) return "files";
  return null;
}

const LONG_PRESS_MS = 600;
const LONG_PRESS_MOVE_TOLERANCE_PX = 10;

/**
 * Press-and-hold for touch / pen (a mouse uses the hover bin instead).
 * `consumeClick()` returns true once after a long press so the click that follows it is ignored.
 */
function useLongPress(onLongPress: () => void, enabled: boolean) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const fired = useRef(false);
  const [pressing, setPressing] = useState(false);

  function cancel() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    origin.current = null;
    setPressing(false);
  }

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return {
    pressing,
    consumeClick() {
      const was = fired.current;
      fired.current = false;
      return was;
    },
    handlers: {
      onPointerDown(e: PointerEvent<HTMLElement>) {
        if (!enabled || e.pointerType === "mouse") return;
        fired.current = false;
        origin.current = { x: e.clientX, y: e.clientY };
        setPressing(true);
        timer.current = setTimeout(() => {
          timer.current = null;
          fired.current = true;
          setPressing(false);
          if (typeof navigator !== "undefined" && "vibrate" in navigator)
            navigator.vibrate(30);
          onLongPress();
        }, LONG_PRESS_MS);
      },
      onPointerMove(e: PointerEvent<HTMLElement>) {
        const start = origin.current;
        if (!start || !timer.current) return;
        // Scrolling or dragging is not a long press.
        if (
          Math.hypot(e.clientX - start.x, e.clientY - start.y) >
          LONG_PRESS_MOVE_TOLERANCE_PX
        ) {
          cancel();
        }
      },
      onPointerUp: cancel,
      onPointerLeave: cancel,
      onPointerCancel: cancel,
      onContextMenu(e: React.MouseEvent) {
        e.preventDefault();
      },
    },
  };
}

/** Red fill + bin that grows in while a long press is in progress. */
function PressFill({ pressing }: { pressing: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 flex items-center justify-center bg-destructive/70 text-white ease-linear",
        pressing
          ? "opacity-100 transition-opacity duration-[550ms]"
          : "opacity-0 transition-opacity duration-100",
      )}
    >
      <Trash2 className="size-5" />
    </span>
  );
}

/**
 * A photo thumbnail that can be removed on any device:
 *  - mouse: hover reveals a bin button, click removes it
 *  - touch / pen: press and hold (with a red fill as feedback) removes it
 */
function PhotoThumb({
  photo,
  active,
  readOnly,
  onSelect,
  onRemove,
}: {
  photo: StudioPhoto;
  active: boolean;
  readOnly: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const press = useLongPress(onRemove, !readOnly);

  return (
    <div className="photo-bin-host relative">
      <button
        type="button"
        onClick={() => {
          // The click that follows a long press must not also select the photo.
          if (press.consumeClick()) return;
          onSelect();
        }}
        {...press.handlers}
        aria-label="Show this photo"
        className={cn(
          "relative block aspect-[4/3] w-full touch-manipulation overflow-hidden rounded-lg border-2 transition-transform select-none [-webkit-touch-callout:none]",
          active ? "border-gold" : "border-white/70",
          press.pressing && "scale-95",
        )}
      >
        <PropertyImage
          src={photo.url}
          alt=""
          fill
          sizes="160px"
          draggable={false}
          className="pointer-events-none object-cover"
        />
        <PressFill pressing={press.pressing} />
      </button>

      {!readOnly && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove photo"
          title="Remove photo"
          className="photo-bin absolute top-1 right-1 flex size-7 lg:size-6 items-center justify-center rounded-full bg-white/95 text-destructive shadow transition hover:bg-destructive hover:text-white"
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
    </div>
  );
}

export function ListingCanvas({
  preview,
  title,
  onTitle,
  description,
  locationLabel,
  stayDuration,
  verifiedLabel,
  features,
  photos,
  pending,
  onFiles,
  onAddFeature,
  onStepFeature,
  onRemoveFeature,
  onMakeCover,
  onRemovePhoto,
  price,
  onPrice,
  action,
}: {
  preview: boolean;
  title: string;
  onTitle: (value: string) => void;
  description: string;
  locationLabel: string;
  stayDuration: StayDuration;
  verifiedLabel: string;
  features: ListingFeatures;
  photos: StudioPhoto[];
  pending: PendingPhoto[];
  onFiles: (files: File[]) => void;
  onAddFeature: (key: FeatureKey) => void;
  onStepFeature: (key: FeatureKey, delta: 1 | -1) => void;
  onRemoveFeature: (key: FeatureKey) => void;
  onMakeCover: (id: string) => void;
  onRemovePhoto: (id: string) => void;
  price: string;
  onPrice: (value: string) => void;
  action: ReactNode;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState<DragKind>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const active = photos.find((p) => p.id === viewId) ?? photos[0];
  const heroPress = useLongPress(
    () => {
      if (active) onRemovePhoto(active.id);
    },
    !preview && Boolean(active),
  );
  const isCover = active ? photos[0]?.id === active.id : false;
  const thumbs = photos.slice(0, 4);
  const hiddenCount = Math.max(photos.length - thumbs.length, 0);
  const full = photos.length + pending.length >= MAX_PHOTOS;
  const addedKeys = FEATURES.filter((f) => (features[f.key] ?? 0) > 0);
  const priceNum = Number(price) || 0;

  function onGalleryDragOver(e: DragEvent) {
    if (preview) return;
    const kind = dragKindOf(e);
    if (kind !== "files") return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDrag("files");
  }

  function onGalleryDrop(e: DragEvent) {
    if (preview || dragKindOf(e) !== "files") return;
    e.preventDefault();
    setDrag(null);
    onFiles(Array.from(e.dataTransfer.files));
  }

  function onFeatureDragOver(e: DragEvent) {
    if (preview || dragKindOf(e) !== "feature") return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDrag("feature");
  }

  function onFeatureDrop(e: DragEvent) {
    if (preview) return;
    const key = e.dataTransfer.getData(FEATURE_MIME) as FeatureKey;
    setDrag(null);
    if (!key || !(key in FEATURE_BY_KEY)) return;
    e.preventDefault();
    onAddFeature(key);
  }

  return (
    <article
      aria-label="Listing card canvas"
      className="overflow-hidden rounded-2xl border border-border bg-white p-3 shadow-sm sm:p-4"
    >
      {/* Gallery / photo upload holder */}
      <div
        onDragOver={onGalleryDragOver}
        onDragLeave={() => setDrag((d) => (d === "files" ? null : d))}
        onDrop={onGalleryDrop}
        className={cn(
          "photo-bin-host relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-[#e9ecef] to-[#d9dde2] sm:aspect-[16/10]",
          drag === "files" && "ring-2 ring-gold ring-offset-2",
        )}
      >
        {active ? (
          <PropertyImage
            src={active.url}
            alt={`${title || "Listing"} photo`}
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover"
          />
        ) : null}

        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />

        {/* Press and hold the main photo (touch) to remove it */}
        {active && !preview && (
          <div
            {...heroPress.handlers}
            className="absolute inset-0 touch-manipulation select-none [-webkit-touch-callout:none]"
          >
            <PressFill pressing={heroPress.pressing} />
          </div>
        )}

        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-verified px-3 py-1 text-[11px] font-semibold text-white shadow">
          <ShieldCheck className="size-3.5" />
          {verifiedLabel}
        </span>
        <span
          aria-hidden
          className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-white text-brand shadow"
        >
          <Heart className="size-4" />
        </span>

        {!preview && (
          <>
            {photos.length === 0 || drag === "files" ? (
              <button
                type="button"
                disabled={full}
                onClick={() => fileInput.current?.click()}
                className={cn(
                  "absolute top-1/2 left-1/2 flex w-[min(72%,20rem)] -translate-x-1/2 -translate-y-[60%] flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center text-white backdrop-blur-sm transition",
                  drag === "files"
                    ? "border-gold bg-black/45"
                    : "border-white/80 bg-black/25 hover:bg-black/35",
                )}
              >
                <CloudUpload className="size-8" strokeWidth={1.5} />
                <span className="text-sm leading-snug font-semibold">
                  Drag &amp; drop photos here
                  <br />
                  <span className="font-normal opacity-90">
                    or click to upload
                  </span>
                </span>
              </button>
            ) : (
              <button
                type="button"
                disabled={full}
                onClick={() => fileInput.current?.click()}
                className="absolute top-1/2 left-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-2 text-xs font-semibold text-brand opacity-90 shadow-lg backdrop-blur transition hover:opacity-100 disabled:opacity-50"
              >
                <ImagePlus className="size-4" />
                {full ? "Photo limit reached" : "Add photos"}
              </button>
            )}
            {active && (
              <div className="absolute top-14 right-3 flex flex-col items-end gap-2">
                <button
                  type="button"
                  onClick={() => onRemovePhoto(active.id)}
                  aria-label="Remove this photo"
                  title="Remove this photo"
                  className="photo-bin flex size-9 items-center justify-center rounded-full bg-white text-destructive shadow transition hover:bg-destructive hover:text-white"
                >
                  <Trash2 className="size-4" />
                </button>
                {!isCover && (
                  <button
                    type="button"
                    onClick={() => onMakeCover(active.id)}
                    className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-brand shadow"
                  >
                    <Star className="size-3" />
                    Make cover
                  </button>
                )}
              </div>
            )}
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = "";
                if (files.length) onFiles(files);
              }}
            />
          </>
        )}

        {/* Thumbnail strip */}
        {(photos.length > 0 || pending.length > 0) && (
          <ul className="absolute right-2 bottom-2 left-2 flex gap-1.5 sm:right-3 sm:bottom-3 sm:left-3 sm:gap-2">
            {thumbs.map((photo) => (
              <li key={photo.id} className="min-w-0 flex-1">
                <PhotoThumb
                  photo={photo}
                  active={active?.id === photo.id}
                  readOnly={preview}
                  onSelect={() => setViewId(photo.id)}
                  onRemove={() => onRemovePhoto(photo.id)}
                />
              </li>
            ))}
            {pending.map((p) => (
              <li key={p.id} className="relative min-w-0 flex-1">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border-2 border-white/70">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview while the upload runs */}
                  <img
                    src={p.preview}
                    alt=""
                    className="size-full object-cover opacity-60"
                  />
                  <Loader2 className="absolute inset-0 m-auto size-5 animate-spin text-white" />
                </div>
              </li>
            ))}
            {hiddenCount > 0 && (
              <li className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => setShowAll((v) => !v)}
                  aria-expanded={showAll}
                  aria-label={
                    showAll
                      ? "Hide all photos"
                      : `Show all ${photos.length} photos`
                  }
                  className="flex aspect-[4/3] w-full items-center justify-center rounded-lg bg-black/45 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-black/60"
                >
                  +{hiddenCount}
                </button>
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Every photo, so any of them can be removed (the strip above only fits a few) */}
      {showAll && photos.length > 0 && (
        <div className="mt-3 rounded-2xl border border-border bg-secondary/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-brand">
              All photos ({photos.length})
            </p>
            <button
              type="button"
              onClick={() => setShowAll(false)}
              className="text-[11px] font-semibold text-muted-foreground hover:text-foreground"
            >
              Hide
            </button>
          </div>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {photos.map((photo) => (
              <li key={photo.id}>
                <PhotoThumb
                  photo={photo}
                  active={active?.id === photo.id}
                  readOnly={preview}
                  onSelect={() => setViewId(photo.id)}
                  onRemove={() => onRemovePhoto(photo.id)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {!preview && photos.length > 0 && (
        <p className="mt-2 px-1 text-[11px] text-muted-foreground">
          Click the bin on a photo to remove it (hover a photo to reveal it), or
          press and hold a photo on a touch screen.
        </p>
      )}

      {/* Title + location */}
      <div className="mt-4 flex items-start justify-between gap-3 px-1">
        <div className="min-w-0 flex-1">
          {preview ? (
            <h2 className="text-xl leading-tight font-bold tracking-tight text-brand">
              {title || "Untitled listing"}
            </h2>
          ) : (
            <input
              value={title}
              onChange={(e) => onTitle(e.target.value)}
              maxLength={150}
              placeholder="Name your listing"
              aria-label="Listing title"
              className="w-full rounded-lg border border-transparent bg-transparent px-1 py-2 lg:py-0.5 -mx-1 text-lg leading-tight font-bold tracking-tight text-brand outline-none transition placeholder:text-muted-foreground/60 hover:border-border focus:border-gold focus:bg-white sm:text-xl"
            />
          )}
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{locationLabel}</span>
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-brand">
          {stayDuration === "short_stay"
            ? STAY_DURATION_LABELS.short_stay
            : "For Rent"}
        </span>
      </div>

      {/* Description (the details panel is hidden in preview, so show it here) */}
      {preview && description.trim() && (
        <p className="mt-3 px-1 text-sm leading-relaxed whitespace-pre-line text-foreground/80">
          {description.trim()}
        </p>
      )}

      {/* Feature drop zone */}
      <div
        onDragOver={onFeatureDragOver}
        onDragLeave={() => setDrag((d) => (d === "feature" ? null : d))}
        onDrop={onFeatureDrop}
        className={cn(
          "mt-4 rounded-2xl border px-3 py-3 transition",
          drag === "feature"
            ? "border-dashed border-gold bg-accent/60"
            : addedKeys.length === 0
              ? "border-dashed border-border bg-secondary/40"
              : "border-transparent px-1",
        )}
      >
        {addedKeys.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            Drag components here — bedrooms, bathrooms, parking and more.
          </p>
        ) : (
          <ul className="grid gap-x-4 gap-y-2.5 sm:grid-cols-2">
            {addedKeys.map((feature) => {
              const Icon = feature.icon;
              const count = features[feature.key] ?? 0;
              return (
                <li
                  key={feature.key}
                  className="group flex items-center gap-2.5 rounded-xl border border-border/70 bg-white px-3 py-2"
                >
                  <Icon
                    className="size-5 shrink-0 text-brand"
                    strokeWidth={1.6}
                  />
                  {preview ? (
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                      {featureCountLabel(feature.key, count)}
                    </span>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                        {feature.countable ? feature.plural : feature.label}
                      </span>
                      {feature.countable ? (
                        <span className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onStepFeature(feature.key, -1)}
                            aria-label={
                              count <= 1
                                ? `Remove ${feature.label}`
                                : `Fewer ${feature.plural.toLowerCase()}`
                            }
                            className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:border-gold hover:text-brand lg:size-6"
                          >
                            {count <= 1 ? (
                              <Trash2 className="size-3" />
                            ) : (
                              <Minus className="size-3" />
                            )}
                          </button>
                          <span
                            aria-live="polite"
                            className="w-5 text-center text-sm font-bold text-brand tabular-nums"
                          >
                            {count}
                          </span>
                          <button
                            type="button"
                            onClick={() => onStepFeature(feature.key, 1)}
                            disabled={count >= feature.max}
                            aria-label={`More ${feature.plural.toLowerCase()}`}
                            className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:border-gold hover:text-brand lg:size-6 disabled:opacity-40"
                          >
                            <Plus className="size-3" />
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onRemoveFeature(feature.key)}
                          aria-label={`Remove ${feature.label}`}
                          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:border-gold hover:text-brand lg:size-6"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Price + primary action */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border px-1 pt-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Rent
          </p>
          {preview ? (
            <p className="text-2xl font-bold tracking-tight text-brand tabular-nums">
              {priceNum > 0 ? `₵${priceNum.toLocaleString("en-GH")}` : "—"}{" "}
              <span className="text-base font-medium text-muted-foreground">
                pcm
              </span>
            </p>
          ) : (
            <label className="flex items-baseline gap-1.5 text-2xl font-bold tracking-tight text-brand">
              <span aria-hidden>₵</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={price}
                onChange={(e) => onPrice(e.target.value)}
                placeholder="0"
                aria-label="Monthly rent in Ghana cedis"
                style={{
                  width: `${Math.min(Math.max(price.length, 1) + 2, 14)}ch`,
                }}
                className="min-w-[2.5ch] rounded-lg border border-transparent bg-transparent px-1 py-0.5 -mx-1 tabular-nums outline-none transition placeholder:text-muted-foreground/50 hover:border-border focus:border-gold focus:bg-white"
              />
              <span className="text-base font-medium text-muted-foreground">
                pcm
              </span>
            </label>
          )}
        </div>
        <div className="max-lg:hidden">{action}</div>
      </div>
    </article>
  );
}
