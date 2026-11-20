"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TenancyPanel } from "@/components/rentals/TenancyPanel";
import { ADVANCE_LABELS } from "@/lib/format";
import type { RentalRequestDto } from "@/lib/types";

export function RentalDesk() {
  const { status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<RentalRequestDto[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status !== "authenticated") return;
    fetch("/api/v1/me/rentals")
      .then((res) => res.json())
      .then((data) =>
        setRequests((data.requests ?? []).filter((row: RentalRequestDto) => !row.is_landlord))
      )
      .catch(() => toast.error("Could not load your requests"));
  }, [status, router]);

  async function cancel(id: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/v1/rentals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not cancel");
        return;
      }
      setRequests((prev) => prev?.map((row) => (row.id === id ? data.request : row)) ?? prev);
      toast.success("Request cancelled");
    } finally {
      setBusy(null);
    }
  }

  if (!requests) {
    return <p className="px-4 py-10 text-center text-sm text-muted-foreground">Loading requests…</p>;
  }

  if (requests.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-muted-foreground">
        You have not requested a viewing or applied to a home yet.
      </p>
    );
  }

  return (
    <ul className="space-y-3 px-4 py-4">
      {requests.map((row) => (
        <li key={row.id} className="rounded-2xl border border-border bg-white p-4">
          <p className="text-sm font-semibold">
            {row.kind === "tour" ? "Viewing" : "Application"} · {row.status.replace("_", " ")}
          </p>
          <Link href={`/properties/${row.property_id}`} className="text-sm text-primary">
            {row.property_title}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            {row.viewing_at ? new Date(row.viewing_at).toLocaleString() : null}
            {row.move_in_date ? `Move-in ${row.move_in_date}` : null}
            {row.offered_advance ? ` · ${ADVANCE_LABELS[row.offered_advance]}` : null}
            {row.advance_receipt === "landlord_confirmed" ? " · Advance recorded" : null}
          </p>
          {row.landlord_note ? (
            <p className="mt-2 text-sm text-muted-foreground">{row.landlord_note}</p>
          ) : null}
          <TenancyPanel
            row={row}
            onRefresh={() => {
              fetch("/api/v1/me/rentals")
                .then((res) => res.json())
                .then((data) =>
                  setRequests((data.requests ?? []).filter((item: RentalRequestDto) => !item.is_landlord))
                )
                .catch(() => toast.error("Could not refresh requests"));
            }}
          />
          {(row.status === "requested" || row.status === "accepted") && (
            <Button
              size="sm"
              variant="outline"
              className="mt-3 rounded-xl"
              disabled={busy === row.id}
              onClick={() => cancel(row.id)}
            >
              Cancel
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
