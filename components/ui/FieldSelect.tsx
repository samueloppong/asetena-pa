"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type FieldSelectOption = {
  value: string;
  label: string;
};

export function FieldSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select",
  className,
  triggerClassName,
  contentClassName,
  size = "lg",
  "aria-label": ariaLabel,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: FieldSelectOption[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  size?: "sm" | "lg";
  "aria-label"?: string;
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (next != null) onValueChange(String(next));
      }}
      items={options}
    >
      <SelectTrigger
        aria-label={ariaLabel}
        size={size === "sm" ? "md" : "lg"}
        className={cn(
          "w-full min-w-0 border-border bg-background pr-3 pl-3 text-sm shadow-none transition",
          "hover:border-gold/50 hover:bg-white",
          "focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/25",
          "data-[popup-open]:border-gold data-[popup-open]:ring-2 data-[popup-open]:ring-gold/25",
          triggerClassName
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        align="start"
        sideOffset={6}
        className={cn(
          "rounded-[0.85rem] border border-border bg-white p-1.5 shadow-[0_18px_40px_rgb(0_0_0/0.12)] ring-0",
          contentClassName,
          className
        )}
      >
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className={cn(
              "cursor-pointer rounded-[0.55rem] px-3 py-2.5 text-sm font-medium text-foreground",
              "data-highlighted:bg-[#fff8eb] data-highlighted:text-foreground",
              "data-[selected]:bg-gold/15 data-[selected]:text-foreground"
            )}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
