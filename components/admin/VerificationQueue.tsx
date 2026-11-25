"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  fetchPendingVerifications,
  reviewVerificationRequest,
} from "@/lib/api-client";
import type { AdminVerificationRequest } from "@/lib/types";
import { Button } from "@/components/ui/button";

const DOCUMENT_LABELS: Record<string, string> = {
  ghana_card: "Ghana Card",
  passport: "Passport",
  drivers_license: "Driver's License",
};

export function VerificationQueue() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<AdminVerificationRequest[] | null>(
    null
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status !== "authenticated") return;
    if (session?.user.role !== "admin") {
      router.push("/");
      return;
    }
    fetchPendingVerifications()
      .then(setRequests)
      .catch(() => toast.error("Could not load the verification queue"));
  }, [status, session, router]);

  async function decide(id: string, decision: "verified" | "rejected") {
    setBusyId(id);
    try {
      await reviewVerificationRequest(id, decision);
      setRequests((prev) => (prev ? prev.filter((r) => r.id !== id) : prev));
      toast.success(decision === "verified" ? "Approved" : "Rejected");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save decision");
    } finally {
      setBusyId(null);
    }
  }

  if (requests === null) {
    return (
      <p className="px-4 py-10 text-center text-sm text-muted-foreground">
        Loading queue…
      </p>
    );
  }

  if (requests.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-muted-foreground">
        No verification requests waiting for review.
      </p>
    );
  }

  return (
    <ul className="space-y-4 px-4 py-4">
      {requests.map((r) => (
        <li key={r.id} className="rounded-2xl border border-border bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {r.user_name}{" "}
                <span className="font-normal text-muted-foreground">
                  · {r.user_role}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">{r.user_email}</p>
            </div>
            <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-primary">
              {DOCUMENT_LABELS[r.document_type] ?? r.document_type}
            </span>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            ID number: <span className="font-medium text-foreground">{r.id_number}</span>
          </p>
          {(r.user_role === "agent" || r.user_role === "firm") && (
            <p className="mt-1 text-xs text-muted-foreground">
              {r.user_role === "firm" ? "Firm" : "Agent"} registration no.:{" "}
              <span className="font-medium text-foreground">
                {r.user_registration_number ?? "Not provided"}
              </span>
              {r.user_company_name ? ` · ${r.user_company_name}` : ""}
            </p>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
              <Image
                src={r.id_photo_url}
                alt="Submitted ID"
                fill
                className="object-cover"
                sizes="200px"
              />
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
              <Image
                src={r.selfie_url}
                alt="Submitted selfie"
                fill
                className="object-cover"
                sizes="200px"
              />
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              size="sm"
              className="rounded-full"
              disabled={busyId === r.id}
              onClick={() => decide(r.id, "verified")}
            >
              Approve
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="rounded-full"
              disabled={busyId === r.id}
              onClick={() => decide(r.id, "rejected")}
            >
              Reject
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
