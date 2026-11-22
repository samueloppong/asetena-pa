import {
  Bath,
  BedDouble,
  CigaretteOff,
  Shield,
  Sun,
  Users,
  Zap,
} from "lucide-react";
import {
  ADVANCE_LABELS,
  FURNISHING_LABELS,
  STAY_DURATION_LABELS,
  formatGhs,
  maxPersonsLabel,
} from "@/lib/format";
import type { Furnishing, PaymentFrequency, StayDuration } from "@/lib/types";
import { cn } from "@/lib/utils";

const FURNISHING_CHIP: Record<Furnishing, string> = {
  furnished: "border-emerald-200 bg-emerald-50 text-verified",
  semi_furnished: "border-amber-200 bg-amber-50 text-amber-900",
  unfurnished: "border-border bg-secondary text-foreground",
};

const STAY_CHIP: Record<StayDuration, string> = {
  long_stay: "border-border bg-secondary/80 text-foreground",
  short_stay: "border-sky-200 bg-sky-50 text-sky-900",
};

export function ListingFactsRow({
  bedrooms,
  bathrooms,
  maxOccupants,
  smokingAllowed,
  furnishing,
  stayDuration = "long_stay",
  advancePeriod,
  securityDeposit,
  hasGenerator = false,
  hasSolar = false,
  compact = false,
}: {
  bedrooms: number;
  bathrooms: number;
  maxOccupants?: number | null;
  smokingAllowed: boolean;
  furnishing: Furnishing;
  stayDuration?: StayDuration;
  advancePeriod: PaymentFrequency;
  securityDeposit: number;
  hasGenerator?: boolean;
  hasSolar?: boolean;
  compact?: boolean;
}) {
  const persons = maxPersonsLabel(maxOccupants, bedrooms).replace(/^Up to /, "");

  return (
    <div className={cn("space-y-2", compact && "space-y-1.5")}>
      <div className="flex flex-wrap gap-1.5">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
            STAY_CHIP[stayDuration]
          )}
        >
          {STAY_DURATION_LABELS[stayDuration]}
        </span>
        <span className="inline-flex items-center rounded-full border border-border bg-secondary/80 px-2 py-0.5 text-[11px] font-semibold text-foreground">
          {ADVANCE_LABELS[advancePeriod]}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-2 py-0.5 text-[11px] font-semibold text-foreground">
          <Shield className="size-3 text-primary" />
          {securityDeposit > 0
            ? `Deposit ${formatGhs(securityDeposit)}`
            : "No deposit"}
        </span>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wide",
            FURNISHING_CHIP[furnishing]
          )}
        >
          {FURNISHING_LABELS[furnishing]}
        </span>
      </div>

      <div
        className={cn(
          "flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-1 text-muted-foreground",
          compact ? "text-[11px]" : "text-xs"
        )}
      >
        <span className="inline-flex items-center justify-center gap-1 text-center font-medium text-foreground">
          <BedDouble className="size-3.5 shrink-0 text-primary" aria-hidden />
          <span>
            {bedrooms === 0 ? "Studio" : bedrooms}
            <span className="sr-only">
              {bedrooms === 0 ? " studio" : bedrooms === 1 ? " bedroom" : " bedrooms"}
            </span>
          </span>
        </span>
        <span className="inline-flex items-center justify-center gap-1 text-center font-medium text-foreground">
          <Bath className="size-3.5 shrink-0 text-primary" aria-hidden />
          <span>
            {bathrooms}
            <span className="sr-only">
              {bathrooms === 1 ? " bathroom" : " bathrooms"}
            </span>
          </span>
        </span>
        <span className="inline-flex items-center justify-center gap-1 text-center font-medium text-foreground">
          <Users className="size-3.5 shrink-0 text-primary" aria-hidden />
          <span>
            {persons}
            <span className="sr-only"> max</span>
          </span>
        </span>
        {!smokingAllowed ? (
          <span className="inline-flex items-center justify-center gap-1 text-center font-medium text-foreground">
            <CigaretteOff className="size-3.5 shrink-0 text-primary" aria-hidden />
            <span>No smoking</span>
          </span>
        ) : null}
        {hasGenerator ? (
          <span className="inline-flex items-center justify-center gap-1 text-center font-medium text-foreground">
            <Zap className="size-3.5 shrink-0 text-primary" aria-hidden />
            <span>Generator</span>
          </span>
        ) : null}
        {hasSolar ? (
          <span className="inline-flex items-center justify-center gap-1 text-center font-medium text-foreground">
            <Sun className="size-3.5 shrink-0 text-primary" aria-hidden />
            <span>Solar</span>
          </span>
        ) : null}
      </div>
    </div>
  );
}
