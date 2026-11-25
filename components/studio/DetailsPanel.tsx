"use client";

import { Check, Circle, ShoppingCart, Sparkles } from "lucide-react";
import { ComboInput } from "@/components/ui/ComboInput";
import { FieldSelect } from "@/components/ui/FieldSelect";
import { PropertyImage } from "@/components/property/PropertyImage";
import {
  GpsCapturePanel,
  type GpsCapture,
} from "@/components/post/GpsCapturePanel";
import {
  ADVANCE_LABELS,
  FURNISHING_OPTIONS,
  PROPERTY_TYPE_LABELS,
  STAY_DURATION_OPTIONS,
} from "@/lib/format";
import { GHANA_REGIONS, getRegionByName } from "@/lib/ghana-locations";
import { ADVANCE_OPTIONS, DEPOSIT_MONTH_OPTIONS } from "@/lib/listing-options";
import type {
  Furnishing,
  PaymentFrequency,
  PropertyType,
  StayDuration,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import type {
  StudioDetails,
  StudioPhoto,
} from "@/components/studio/studio-state";

const TYPE_OPTIONS: PropertyType[] = [
  "apartment",
  "house",
  "chamber_and_hall",
  "single_room",
];

const fieldCls =
  "h-12 w-full rounded-[0.875rem] border border-border bg-background px-3 text-base outline-none transition sm:text-sm placeholder:text-muted-foreground hover:border-gold/50 hover:bg-white focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/25";

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-xs font-semibold text-brand">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>
      {children}
    </div>
  );
}

export type ChecklistItem = { label: string; done: boolean };

export function DetailsPanel({
  details,
  onChange,
  onRegion,
  gps,
  onGps,
  onAutoDescription,
  featureUnits,
  photos,
  checklist,
  className,
}: {
  details: StudioDetails;
  onChange: (patch: Partial<StudioDetails>) => void;
  onRegion: (region: string) => void;
  gps: GpsCapture | null;
  onGps: (value: GpsCapture | null) => void;
  onAutoDescription: () => void;
  featureUnits: number;
  photos: StudioPhoto[];
  checklist: ChecklistItem[];
  className?: string;
}) {
  const region = getRegionByName(details.region);
  const doneCount = checklist.filter((c) => c.done).length;
  const shown = photos.slice(0, 5);
  const more = Math.max(photos.length - shown.length, 0);

  return (
    <aside
      aria-label="Listing details"
      className={cn(
        "space-y-4 rounded-2xl border border-border bg-white p-4 shadow-sm",
        className,
      )}
    >
      <h2 className="text-base font-bold tracking-tight text-brand">
        Listing Details
      </h2>

      <Field label="Description" htmlFor="studio-desc" required>
        <textarea
          id="studio-desc"
          rows={4}
          value={details.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Highlight water, power, and what makes this home unique…"
          className={cn(fieldCls, "h-auto resize-none py-2 leading-relaxed")}
        />
        <button
          type="button"
          onClick={onAutoDescription}
          className="inline-flex items-center gap-1 py-2 text-[11px] font-semibold text-gold-ink hover:underline lg:py-0"
        >
          <Sparkles className="size-3" />
          Write it from my components
        </button>
      </Field>

      <Field label="Property type">
        <FieldSelect
          aria-label="Property type"
          value={details.propertyType}
          onValueChange={(v) => onChange({ propertyType: v as PropertyType })}
          options={TYPE_OPTIONS.map((t) => ({
            value: t,
            label: PROPERTY_TYPE_LABELS[t],
          }))}
        />
      </Field>

      <Field label="Stay length">
        <div className="grid grid-cols-2 gap-1.5">
          {STAY_DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={details.stayDuration === opt.value}
              onClick={() =>
                onChange({
                  stayDuration: opt.value as StayDuration,
                  ...(opt.value === "short_stay"
                    ? { furnishing: "furnished" as Furnishing }
                    : {}),
                })
              }
              className={cn(
                "rounded-xl border px-2 py-2 text-xs font-medium transition",
                details.stayDuration === opt.value
                  ? "border-gold bg-accent text-brand"
                  : "border-border bg-white text-muted-foreground hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Location" required>
        <FieldSelect
          aria-label="Region"
          value={details.region}
          onValueChange={onRegion}
          options={GHANA_REGIONS.map((r) => ({ value: r.name, label: r.name }))}
        />
        <div className="space-y-2">
          <FieldSelect
            aria-label="City or town"
            value={details.city}
            onValueChange={(city) => onChange({ city })}
            options={(region?.cities ?? []).map((c) => ({
              value: c,
              label: c,
            }))}
          />
          <ComboInput
            aria-label="Neighbourhood"
            value={details.neighborhood}
            onValueChange={(neighborhood) => onChange({ neighborhood })}
            options={region?.neighborhoods ?? []}
            placeholder="Neighbourhood"
          />
        </div>
        <input
          aria-label="GhanaPost address"
          value={details.digitalAddress}
          onChange={(e) => onChange({ digitalAddress: e.target.value })}
          placeholder="GhanaPost address, e.g. GA-183-4921"
          className={fieldCls}
        />
      </Field>

      <GpsCapturePanel
        claimedRegion={details.region}
        value={gps}
        onChange={onGps}
      />

      <div className="space-y-4">
        <Field label="Advance">
          <FieldSelect
            aria-label="Advance"
            value={details.advance}
            onValueChange={(v) => onChange({ advance: v as PaymentFrequency })}
            options={ADVANCE_OPTIONS.map((p) => ({
              value: p,
              label: ADVANCE_LABELS[p],
            }))}
          />
        </Field>
        <Field label="Deposit">
          <FieldSelect
            aria-label="Deposit"
            value={details.depositMonths}
            onValueChange={(v) => onChange({ depositMonths: v })}
            options={DEPOSIT_MONTH_OPTIONS.map((o) => ({
              value: String(o.months),
              label: o.label,
            }))}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Furnishing">
          <FieldSelect
            aria-label="Furnishing"
            value={details.furnishing}
            onValueChange={(v) => onChange({ furnishing: v as Furnishing })}
            options={FURNISHING_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
          />
        </Field>
        <Field label="Max persons" htmlFor="studio-max">
          <input
            id="studio-max"
            type="number"
            min={1}
            max={30}
            value={details.maxOccupants}
            onChange={(e) => onChange({ maxOccupants: e.target.value })}
            placeholder="Auto"
            className={fieldCls}
          />
        </Field>
      </div>

      <Field label="Free from" htmlFor="studio-available">
        <input
          id="studio-available"
          type="date"
          value={details.availableFrom}
          onChange={(e) => onChange({ availableFrom: e.target.value })}
          className={fieldCls}
        />
      </Field>

      <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5">
        <span className="text-xs font-semibold text-brand">Bills included</span>
        <button
          type="button"
          role="switch"
          aria-checked={details.billsIncluded}
          aria-label="Bills included"
          onClick={() => onChange({ billsIncluded: !details.billsIncluded })}
          className={cn(
            "relative h-7 w-12 shrink-0 rounded-full transition",
            details.billsIncluded ? "bg-gold" : "bg-border",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow transition-transform",
              details.billsIncluded && "translate-x-5",
            )}
          />
        </button>
      </div>

      {/* Listing cart */}
      <section
        aria-label="Listing summary"
        className="rounded-2xl border border-gold/40 bg-accent/60 p-3.5"
      >
        <p className="flex items-center gap-2 text-sm font-bold text-brand">
          <ShoppingCart className="size-4" />
          Your Listing Summary
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Items:{" "}
          <span className="font-semibold text-foreground">{featureUnits}</span>{" "}
          {featureUnits === 1 ? "feature" : "features"} ·{" "}
          <span className="font-semibold text-foreground">{photos.length}</span>{" "}
          {photos.length === 1 ? "photo" : "photos"}
        </p>
        {photos.length > 0 && (
          <ul className="mt-2.5 flex items-center">
            {shown.map((p, i) => (
              <li
                key={p.id}
                className={cn(
                  "relative size-9 overflow-hidden rounded-full border-2 border-white",
                  i > 0 && "-ml-2",
                )}
              >
                <PropertyImage
                  src={p.url}
                  alt=""
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </li>
            ))}
            {more > 0 && (
              <li className="-ml-2 flex size-9 items-center justify-center rounded-full border-2 border-white bg-white text-[11px] font-bold text-brand">
                +{more}
              </li>
            )}
          </ul>
        )}

        <ul className="mt-3 space-y-1.5" aria-label="Publish checklist">
          {checklist.map((item) => (
            <li
              key={item.label}
              className={cn(
                "flex items-center gap-2 text-[11px]",
                item.done ? "text-verified" : "text-muted-foreground",
              )}
            >
              {item.done ? (
                <Check className="size-3.5" strokeWidth={3} />
              ) : (
                <Circle className="size-3.5" />
              )}
              {item.label}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] font-medium text-brand">
          {doneCount}/{checklist.length} ready to publish
        </p>
      </section>
    </aside>
  );
}
