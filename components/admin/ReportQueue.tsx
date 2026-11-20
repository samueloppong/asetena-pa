"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { AdminListingReport } from "@/lib/types";

export function ReportQueue() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reports, setReports] = useState<AdminListingReport[] | null>(null);
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
    fetch("/api/v1/admin/reports")
      .then((res) => res.json())
      .then((data) => setReports(data.reports ?? []))
      .catch(() => toast.error("Could not load reports"));
  }, [status, session, router]);

  async function act(id: string, action: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/v1/admin/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        toast.error("Could not update the report");
        return;
      }
      if (action === "restore_listing") {
        setReports((prev) =>
          prev?.map((row) => (row.id === id ? { ...row, property_active: true } : row)) ?? prev
        );
      } else {
        setReports((prev) => prev?.filter((row) => row.id !== id) ?? prev);
      }
      toast.success("Saved");
    } finally {
      setBusy(null);
    }
  }

  if (!reports) {
    return <p className="px-4 py-10 text-center text-sm text-muted-foreground">Loading reports…</p>;
  }
  if (reports.length === 0) {
    return <p className="px-4 py-10 text-center text-sm text-muted-foreground">No open listing reports.</p>;
  }

  return (
    <ul className="space-y-3 px-4 py-4">
      {reports.map((report) => (
        <li key={report.id} className="rounded-2xl border border-border bg-white p-4">
          <p className="text-sm font-semibold">{report.property_title}</p>
          <p className="text-xs text-muted-foreground">
            {report.reporter_name} · {report.reason.replaceAll("_", " ")} ·{" "}
            {report.property_active ? "Listing visible" : "Listing hidden"}
          </p>
          {report.details ? <p className="mt-2 text-sm">{report.details}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="rounded-xl" disabled={busy === report.id} onClick={() => act(report.id, "dismissed")}>
              Dismiss
            </Button>
            <Button size="sm" className="rounded-xl" disabled={busy === report.id} onClick={() => act(report.id, "resolved")}>
              Confirm problem
            </Button>
            {!report.property_active && (
              <Button size="sm" variant="ghost" className="rounded-xl" disabled={busy === report.id} onClick={() => act(report.id, "restore_listing")}>
                Put listing back
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
