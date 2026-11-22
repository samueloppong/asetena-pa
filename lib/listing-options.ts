import type { PaymentFrequency, StayDuration } from "@/lib/types";
import { ADVANCE_LABELS, STAY_DURATION_OPTIONS } from "@/lib/format";

export { STAY_DURATION_OPTIONS };
export type { StayDuration };

export const BEDROOM_OPTIONS = [0, 1, 2, 3, 4, 5, 6] as const;
export const BATHROOM_OPTIONS = [1, 2, 3, 4, 5] as const;
export const MAX_PERSONS_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10, 12] as const;

/** Deposit expressed as months of rent — computed at publish from monthly price. */
export const DEPOSIT_MONTH_OPTIONS = [
  { months: 0, label: "No deposit" },
  { months: 1, label: "1 month rent" },
  { months: 2, label: "2 months rent" },
  { months: 3, label: "3 months rent" },
] as const;

export const ADVANCE_OPTIONS: PaymentFrequency[] = [
  "monthly",
  "six_months",
  "one_year",
  "two_years",
];

export function bedroomLabel(n: number): string {
  if (n === 0) return "Studio";
  return `${n} bed${n === 1 ? "" : "s"}`;
}

export function bathroomLabel(n: number): string {
  return `${n} bath${n === 1 ? "" : "s"}`;
}

export function depositFromMonths(pricePerMonth: number, months: number): number {
  if (!Number.isFinite(pricePerMonth) || pricePerMonth < 0) return 0;
  return Math.round(pricePerMonth * months);
}

/** Best-effort reverse of deposit ↔ months for edit forms (snaps to 0–3). */
export function depositMonthsFromAmount(
  deposit: number,
  pricePerMonth: number
): number {
  if (!pricePerMonth || deposit <= 0) return 0;
  const ratio = deposit / pricePerMonth;
  return [0, 1, 2, 3].reduce((best, months) =>
    Math.abs(months - ratio) < Math.abs(best - ratio) ? months : best
  );
}

export function advanceOptionLabel(period: PaymentFrequency): string {
  return ADVANCE_LABELS[period];
}
