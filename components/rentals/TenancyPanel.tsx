"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ADVANCE_LABELS, formatPricePerMonth } from "@/lib/format";
import type { RentalRequestDto } from "@/lib/types";

export function TenancyPanel({
  row,
  onRefresh,
}: {
  row: RentalRequestDto;
  onRefresh: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const showTerms = row.kind === "application" && (row.agreed_price != null || row.monthly_income != null);

  async function setStatus(entryId: string, status: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/rentals/${row.id}/ledger`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not update the ledger");
        return;
      }
      onRefresh();
    } finally {
      setBusy(false);
    }
  }

  async function saveHandover(form: FormData, confirm: boolean) {
    setBusy(true);
    try {
      const deductions = form.get("deductions");
      const returned = form.get("returned");
      const res = await fetch(`/api/v1/rentals/${row.id}/handover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conditionNote: String(form.get("condition") || "") || undefined,
          deductions: deductions === "" || deductions == null ? undefined : Number(deductions),
          returnedAmount: returned === "" || returned == null ? undefined : Number(returned),
          confirm,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not save the handover");
        return;
      }
      toast.success(confirm ? "Handover confirmed" : "Handover saved");
      onRefresh();
    } finally {
      setBusy(false);
    }
  }

  async function signAgreement(signedName: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/rentals/${row.id}/agreement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not sign the agreement");
        return;
      }
      toast.success(row.agreement ? "Agreement cosigned" : "Agreement signed");
      onRefresh();
    } finally {
      setBusy(false);
    }
  }

  const canPrepare =
    row.is_landlord &&
    !row.agreement &&
    row.agreed_price != null &&
    (row.status === "accepted" || row.status === "completed");

  if (!showTerms && !row.access_instructions && row.ledger.length === 0 && !row.handover && !row.agreement && !canPrepare) {
    return null;
  }

  return (
    <div className="mt-3 space-y-3 border-t border-border pt-3 text-sm">
      {row.monthly_income != null && (
        <p className="text-muted-foreground">
          Income GHS {row.monthly_income.toLocaleString()} / month stated
          {row.employment_status ? ` · ${row.employment_status.replaceAll("_", " ")}` : ""}
          {row.previous_landlord_name
            ? ` · last landlord ${row.previous_landlord_name}${row.previous_landlord_phone ? ` (${row.previous_landlord_phone})` : ""}`
            : ""}
        </p>
      )}
      {row.previous_landlord_note ? (
        <p className="text-muted-foreground">{row.previous_landlord_note}</p>
      ) : null}
      {row.agreed_price != null && (
        <div>
          <p className="font-semibold">Agreed terms</p>
          <p className="text-muted-foreground">
            {formatPricePerMonth(row.agreed_price)}
            {row.agreed_deposit != null ? ` · deposit GHS ${row.agreed_deposit.toLocaleString()}` : ""}
            {row.agreed_advance ? ` · ${ADVANCE_LABELS[row.agreed_advance]}` : ""}
            {row.agreed_move_in ? ` · move-in ${row.agreed_move_in}` : ""}
          </p>
          {row.hold_until && row.status === "accepted" ? (
            <p className="text-xs text-muted-foreground">
              Held until {new Date(row.hold_until).toLocaleDateString()}
            </p>
          ) : null}
          {row.agreed_rules ? (
            <pre className="mt-2 whitespace-pre-wrap font-sans text-xs text-muted-foreground">
              {row.agreed_rules}
            </pre>
          ) : null}
        </div>
      )}
      {(canPrepare || row.agreement) && (
        <div className="space-y-2">
          <p className="font-semibold">Tenancy agreement</p>
          {row.agreement ? (
            <>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-secondary p-3 font-sans text-xs text-foreground">
                {row.agreement.body}
              </pre>
              <p className="text-xs text-muted-foreground">
                Landlord {row.agreement.landlord_signed_name} signed{" "}
                {new Date(row.agreement.landlord_signed_at).toLocaleString()}
              </p>
              {row.agreement.renter_signed_at ? (
                <p className="text-xs text-muted-foreground">
                  Tenant {row.agreement.renter_signed_name} cosigned{" "}
                  {new Date(row.agreement.renter_signed_at).toLocaleString()}
                </p>
              ) : row.is_landlord ? (
                <p className="text-xs text-muted-foreground">Waiting for the tenant to cosign.</p>
              ) : (
                <form
                  className="flex flex-wrap gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const name = String(new FormData(event.currentTarget).get("signedName") || "");
                    signAgreement(name);
                  }}
                >
                  <Input
                    name="signedName"
                    required
                    defaultValue={row.renter_name}
                    className="h-10 max-w-xs rounded-xl"
                  />
                  <Button type="submit" size="sm" className="rounded-xl" disabled={busy}>
                    Cosign
                  </Button>
                </form>
              )}
            </>
          ) : (
            <form
              className="space-y-2"
              onSubmit={(event) => {
                event.preventDefault();
                const name = String(new FormData(event.currentTarget).get("signedName") || "");
                signAgreement(name);
              }}
            >
              <p className="text-xs text-muted-foreground">
                This writes the frozen terms into an agreement and signs it with your account name.
              </p>
              <Input
                name="signedName"
                required
                defaultValue={row.landlord_name}
                className="h-10 rounded-xl"
              />
              <Button type="submit" size="sm" className="rounded-xl" disabled={busy}>
                Generate and sign
              </Button>
            </form>
          )}
        </div>
      )}
      {row.access_instructions ? (
        <p>
          <span className="font-semibold">How to get in. </span>
          {row.access_instructions}
        </p>
      ) : null}
      {row.ledger.length > 0 && (
        <ul className="space-y-2">
          {row.ledger.map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-center gap-2">
              <span>
                {entry.label} · GHS {entry.amount.toLocaleString()} · due {entry.due_date} · {entry.status}
              </span>
              {row.is_landlord && (
                <select
                  className="h-8 rounded-lg border border-input bg-white px-2 text-xs"
                  value={entry.status}
                  disabled={busy}
                  onChange={(e) => setStatus(entry.id, e.target.value)}
                >
                  <option value="expected">expected</option>
                  <option value="received">received</option>
                  <option value="late">late</option>
                </select>
              )}
            </li>
          ))}
        </ul>
      )}
      {row.handover && row.status === "completed" && (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            saveHandover(new FormData(e.currentTarget), true);
          }}
        >
          <p className="font-semibold">Deposit handover</p>
          <Textarea
            name="condition"
            defaultValue={row.handover.condition_note ?? ""}
            placeholder="Condition of the home"
            disabled={!row.is_landlord}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              name="deductions"
              type="number"
              min={0}
              defaultValue={row.handover.deductions}
              placeholder="Deductions"
              className="h-10 rounded-xl"
              disabled={!row.is_landlord}
            />
            <Input
              name="returned"
              type="number"
              min={0}
              defaultValue={row.handover.returned_amount ?? ""}
              placeholder="Returned"
              className="h-10 rounded-xl"
              disabled={!row.is_landlord}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {row.handover.landlord_confirmed ? "Landlord confirmed" : "Landlord has not confirmed"}
            {" · "}
            {row.handover.renter_confirmed ? "Renter confirmed" : "Renter has not confirmed"}
          </p>
          <Button type="submit" size="sm" className="rounded-xl" disabled={busy}>
            {row.is_landlord ? "Save and confirm handover" : "Confirm handover"}
          </Button>
        </form>
      )}
    </div>
  );
}
