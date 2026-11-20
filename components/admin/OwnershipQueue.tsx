"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { AdminOwnershipClaim } from "@/lib/types";

export function OwnershipQueue() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [claims, setClaims] = useState<AdminOwnershipClaim[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status !== "authenticated") return;
    if (session.user.role !== "admin") {
      router.push("/");
      return;
    }
    fetch("/api/v1/admin/ownership")
      .then((res) => res.json())
      .then((data) => setClaims(data.claims ?? []))
      .catch(() => toast.error("Could not load ownership claims"));
  }, [status, session, router]);

  async function decide(id: string, decision: "verified" | "rejected") {
    setBusy(id);
    try {
      const res = await fetch(`/api/v1/admin/ownership/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) {
        toast.error("Could not save the decision");
        return;
      }
      setClaims((prev) => prev?.filter((row) => row.property_id !== id) ?? prev);
      toast.success(decision === "verified" ? "Owner verified" : "Claim rejected");
    } finally {
      setBusy(null);
    }
  }

  if (!claims) {
    return <p className="px-4 py-10 text-center text-sm text-muted-foreground">Loading claims…</p>;
  }
  if (claims.length === 0) {
    return <p className="px-4 py-10 text-center text-sm text-muted-foreground">No ownership documents waiting.</p>;
  }

  return (
    <ul className="space-y-3 px-4 py-4">
      {claims.map((claim) => (
        <li key={claim.property_id} className="rounded-2xl border border-border bg-white p-4">
          <p className="text-sm font-semibold">{claim.title}</p>
          <p className="text-xs text-muted-foreground">
            {claim.landlord_name} · {claim.landlord_email}
          </p>
          <a href={claim.document_url} className="mt-2 inline-block text-sm text-primary" target="_blank" rel="noreferrer">
            Open document
          </a>
          <div className="mt-3 flex gap-2">
            <Button size="sm" className="rounded-xl" disabled={busy === claim.property_id} onClick={() => decide(claim.property_id, "verified")}>
              Verify owner
            </Button>
            <Button size="sm" variant="outline" className="rounded-xl" disabled={busy === claim.property_id} onClick={() => decide(claim.property_id, "rejected")}>
              Reject
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
