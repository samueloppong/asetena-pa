"use client";

import { Calculator } from "lucide-react";
import { formatGhs } from "@/lib/format";
import type { PaymentFrequency } from "@/lib/types";

const ADVANCE_MONTHS: Record<PaymentFrequency, number> = {
  monthly: 1,
  six_months: 6,
  one_year: 12,
  two_years: 24,
};

interface MoveInCostCalculatorProps {
  pricePerMonth: number;
  advancePeriod: PaymentFrequency;
  securityDeposit: number;
}

export function MoveInCostCalculator({
  pricePerMonth,
  advancePeriod,
  securityDeposit,
}: MoveInCostCalculatorProps) {
  const months = ADVANCE_MONTHS[advancePeriod];
  const rentDue = pricePerMonth * months;
  const total = rentDue + securityDeposit;
  const monthlyEquivalent = total / months;

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-white p-4">
      <h2 className="flex items-center gap-2 text-base font-bold text-brand">
        <Calculator className="size-4 text-primary" />
        What you&apos;ll need to move in
      </h2>
      <p className="text-xs text-muted-foreground">
        Ghana rentals are usually paid upfront in one lump sum — here&apos;s the
        real total so there are no surprises at handover.
      </p>
      <dl className="space-y-2 text-sm">
        <Row label={`Rent (${months} ${months === 1 ? "month" : "months"} advance)`} value={formatGhs(rentDue)} />
        {securityDeposit > 0 && (
          <Row label="Security deposit (held)" value={formatGhs(securityDeposit)} />
        )}
        <div className="my-1 border-t border-dashed border-border" />
        <Row label="Total due at move-in" value={formatGhs(total)} strong />
        {months > 1 && (
          <p className="pt-1 text-xs text-muted-foreground">
            That works out to about{" "}
            <span className="font-semibold text-foreground">
              {formatGhs(Math.round(monthlyEquivalent))}
            </span>{" "}
            per month if you were spreading the cost yourself.
          </p>
        )}
      </dl>
      {securityDeposit > 0 ? (
        <p className="rounded-xl bg-secondary/70 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          The landlord holds the security deposit. When you leave or your stay
          ends, damage, missing items, or unpaid bills can be charged against it.
          What remains is returned after both sides confirm the handover.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          This listing has no security deposit.
        </p>
      )}
    </section>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className={strong ? "font-semibold text-foreground" : "text-muted-foreground"}>
        {label}
      </dt>
      <dd className={strong ? "text-base font-bold text-primary" : "font-medium text-foreground"}>
        {value}
      </dd>
    </div>
  );
}
