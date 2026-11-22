"use client";

import { FURNISHING_OPTIONS } from "@/lib/format";
import type { Furnishing } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FurnishingRadios({
  name = "furnishing",
  value,
  onChange,
  defaultValue,
  required = true,
  className,
}: {
  name?: string;
  /** Controlled value (UploadWizard). */
  value?: Furnishing;
  onChange?: (value: Furnishing) => void;
  /** Uncontrolled default (ListingDesk forms). */
  defaultValue?: Furnishing;
  required?: boolean;
  className?: string;
}) {
  const controlled = value !== undefined;

  return (
    <fieldset className={cn("space-y-2", className)}>
      <legend className="text-sm font-medium text-foreground">Furnishing</legend>
      <p className="text-[11px] text-muted-foreground">
        Choose one — renters filter by this, so leave it out of the description.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {FURNISHING_OPTIONS.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-white px-3 py-2.5 text-sm transition hover:bg-secondary/50 has-[:checked]:border-primary has-[:checked]:bg-accent"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              required={required}
              checked={controlled ? value === option.value : undefined}
              defaultChecked={
                !controlled ? defaultValue === option.value : undefined
              }
              onChange={() => onChange?.(option.value)}
              className="size-4 accent-[var(--primary)]"
            />
            <span className="font-medium">{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
