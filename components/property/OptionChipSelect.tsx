"use client";

import { cn } from "@/lib/utils";

type Option = { value: string; label: string };

export function OptionChipSelect({
  name,
  legend,
  hint,
  options,
  value,
  onChange,
  defaultValue,
  columns = 4,
  required = true,
}: {
  name?: string;
  legend: string;
  hint?: string;
  options: Option[];
  value?: string;
  onChange?: (value: string) => void;
  defaultValue?: string;
  columns?: 2 | 3 | 4 | 5 | 6;
  required?: boolean;
}) {
  const controlled = value !== undefined;
  const colClass =
    columns === 2
      ? "grid-cols-2"
      : columns === 3
        ? "grid-cols-3"
        : columns === 5
          ? "grid-cols-3 sm:grid-cols-5"
          : columns === 6
            ? "grid-cols-4 sm:grid-cols-7"
            : "grid-cols-2 sm:grid-cols-4";

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-foreground">{legend}</legend>
      {hint ? (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
      <div className={cn("grid gap-2", colClass)}>
        {options.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center justify-center rounded-xl border border-border bg-white px-2 py-2.5 text-center text-xs font-semibold transition hover:bg-secondary/50 has-[:checked]:border-primary has-[:checked]:bg-accent sm:text-sm"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              required={required}
              className="sr-only"
              checked={controlled ? value === option.value : undefined}
              defaultChecked={
                !controlled ? defaultValue === option.value : undefined
              }
              onChange={() => onChange?.(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
