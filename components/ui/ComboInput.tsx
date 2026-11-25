"use client";

import { Autocomplete } from "@base-ui/react/autocomplete";
import { cn } from "@/lib/utils";

/**
 * Free-text input with a styled suggestion list (replaces the unstyleable native `<datalist>`).
 * Typing narrows the suggestions; anything typed is accepted, suggestions are optional.
 */
export function ComboInput({
  value,
  onValueChange,
  options,
  placeholder,
  emptyLabel = "No match — your own entry will be used",
  className,
  "aria-label": ariaLabel,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  emptyLabel?: string;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <Autocomplete.Root
      items={options}
      value={value}
      onValueChange={(next) => onValueChange(next)}
    >
      <Autocomplete.Input
        aria-label={ariaLabel}
        placeholder={placeholder}
        className={cn(
          "h-12 w-full min-w-0 rounded-[0.875rem] border border-border bg-background px-3 text-base outline-none transition sm:text-sm",
          "placeholder:text-muted-foreground hover:border-gold/50 hover:bg-white",
          "focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/25",
          className,
        )}
      />
      <Autocomplete.Portal>
        <Autocomplete.Positioner
          sideOffset={6}
          align="start"
          className="z-50 outline-hidden"
        >
          <Autocomplete.Popup className="w-[var(--anchor-width)] min-w-[12rem] max-w-[var(--available-width)] overflow-hidden rounded-[0.85rem] border border-border bg-white p-1.5 shadow-[0_18px_40px_rgb(0_0_0/0.12)]">
            <Autocomplete.Empty>
              <p className="px-3 py-2.5 text-xs text-muted-foreground">
                {emptyLabel}
              </p>
            </Autocomplete.Empty>
            <Autocomplete.List className="max-h-[min(15rem,var(--available-height))] overflow-y-auto overscroll-contain outline-0 data-empty:p-0">
              {(item: string) => (
                <Autocomplete.Item
                  key={item}
                  value={item}
                  className={cn(
                    "cursor-pointer rounded-[0.55rem] px-3 py-2.5 text-sm font-medium text-foreground outline-hidden select-none",
                    "data-highlighted:bg-[#fff8eb]",
                  )}
                >
                  {item}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}
