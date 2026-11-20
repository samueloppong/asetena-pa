"use client";

import {
  Building2,
  Home,
  LayoutGrid,
  ShieldCheck,
  Sofa,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FilterChip } from "@/lib/types";

const filters: { id: FilterChip; label: string; icon: typeof Home }[] = [
  { id: "all", label: "All", icon: LayoutGrid },
  { id: "apartment", label: "Apartments", icon: Building2 },
  { id: "house", label: "Houses", icon: Home },
  { id: "chamber_and_hall", label: "Chamber & Hall", icon: Sofa },
  { id: "short_stay", label: "Short Stays", icon: Home },
  { id: "verified", label: "Verified Only", icon: ShieldCheck },
];

interface FilterBadgesProps {
  active: FilterChip;
  onChange: (value: FilterChip) => void;
}

export function FilterBadges({ active, onChange }: FilterBadgesProps) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
      <div className="flex w-max gap-2 pb-1">
        {filters.map(({ id, label, icon: Icon }) => {
          const selected = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={cn(
                "inline-flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium whitespace-nowrap transition-all",
                selected
                  ? "border-transparent bg-[#171717] text-white"
                  : "border-border bg-white text-foreground hover:bg-secondary"
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
