"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShieldAlert, ShieldCheck, UserRound } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/button";
import { VerificationPanel } from "@/components/profile/VerificationPanel";
import { MyTrustScoreCard } from "@/components/profile/MyTrustScoreCard";
import { fetchVerifyStatus } from "@/lib/verify-client";
import type { VerificationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_COPY: Record<
  VerificationStatus,
  { label: string; hint: string; tone: string }
> = {
  unverified: {
    label: "Not verified",
    hint: "Verify your Ghana Card to chat, list, and report safely.",
    tone: "text-amber-700",
  },
  pending: {
    label: "Under review",
    hint: "We’re reviewing your Ghana Card submission.",
    tone: "text-primary",
  },
  verified: {
    label: "Ghana Card verified",
    hint: "You’re cleared to chat, list homes, and contribute insights.",
    tone: "text-verified",
  },
  rejected: {
    label: "Verification rejected",
    hint: "Try again with a clear selfie and a valid Ghana Card number.",
    tone: "text-destructive",
  },
};

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const [kycStatus, setKycStatus] = useState<VerificationStatus>(
    session?.user?.idVerificationStatus ?? "unverified"
  );
  const [ghanaCard, setGhanaCard] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    fetchVerifyStatus()
      .then((data) => {
        if (cancelled) return;
        setKycStatus(data.id_verification_status);
        setGhanaCard(data.ghana_card_number);
        // Do not call session.update() here — it re-fetches the session,
        // flips status through loading, and re-triggers this effect (flash loop).
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [status]);

  async function becomeLandlord() {
    if (kycStatus !== "verified") {
      toast.message("Verify your Ghana Card first");
      return;
    }
    const res = await fetch("/api/v1/me/role", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "landlord" }),
    });
    if (!res.ok) {
      toast.error("Could not update role");
      return;
    }
    await update({ role: "landlord" });
    toast.success("You can now list properties");
  }

  if (status === "loading") {
    return (
      <main className="px-4 py-16 text-center text-sm text-muted-foreground">
        Loading profile…
      </main>
    );
  }

  if (status === "unauthenticated" || !session?.user) {
    return (
      <main className="px-4 py-6">
        <BrandLogo className="mb-4" />
        <h1 className="text-2xl font-extrabold tracking-tight text-brand">
          Profile
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to manage your Asetena Pa account
        </p>
        <div className="mt-8 flex flex-col gap-2">
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-white text-sm font-semibold"
          >
            Create account
          </Link>
        </div>
      </main>
    );
  }

  const copy = STATUS_COPY[kycStatus];

  return (
    <main className="px-4 py-6">
      <BrandLogo className="mb-4" />
      <h1 className="text-2xl font-extrabold tracking-tight text-brand">
        Profile
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Signed in to Asetena Pa
      </p>

      <div className="mt-8 rounded-2xl border border-border bg-white p-5">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <UserRound className="size-7" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{session.user.name}</p>
            <p className="text-xs text-muted-foreground">{session.user.email}</p>
            <p className="mt-1 text-xs font-medium capitalize text-primary">
              {session.user.role}
            </p>
          </div>
        </div>

        <ul className="mt-6 space-y-3 text-sm">
          <li className="flex items-start gap-3 rounded-xl bg-secondary/70 px-3 py-3">
            <ShieldCheck className="mt-0.5 size-4 text-verified" />
            <span>Phone: {session.user.phoneNumber || "—"}</span>
          </li>
          <li className="flex items-start gap-3 rounded-xl bg-secondary/70 px-3 py-3">
            {kycStatus === "verified" ? (
              <ShieldCheck className="mt-0.5 size-4 text-verified" />
            ) : (
              <ShieldAlert className="mt-0.5 size-4 text-amber-600" />
            )}
            <span>
              <span className={cn("font-semibold", copy.tone)}>{copy.label}</span>
              {ghanaCard ? (
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {ghanaCard}
                </span>
              ) : null}
              <span className="mt-1 block text-muted-foreground">{copy.hint}</span>
            </span>
          </li>
        </ul>

        {kycStatus !== "verified" && (
          <div className="mt-4 flex flex-col gap-2">
            <Link
              href="/verify"
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
            >
              Verify Ghana Card (chip NFC)
            </Link>
          </div>
        )}
      </div>

      <div className="mt-6">
        <VerificationPanel />
      </div>

      <div className="mt-6">
        <MyTrustScoreCard />
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {session.user.role === "admin" && (
          <>
            <Link
              href="/admin/verifications"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-white text-sm font-semibold"
            >
              Identity queue
            </Link>
            <Link
              href="/admin/ownership"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-white text-sm font-semibold"
            >
              Ownership claims
            </Link>
            <Link
              href="/admin/reports"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-white text-sm font-semibold"
            >
              Listing reports
            </Link>
          </>
        )}
        <Link
          href="/rentals"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-white text-sm font-semibold"
        >
          My rental requests
        </Link>
        {session.user.role !== "renter" && (
          <Link
            href="/mine"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-white text-sm font-semibold"
          >
            My listings
          </Link>
        )}
        {session.user.role === "renter" && (
          <Button
            type="button"
            className="h-11 rounded-xl"
            onClick={becomeLandlord}
          >
            Become a landlord
          </Button>
        )}
        <Link
          href="/post"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
        >
          List a property
        </Link>
        <Link
          href="/favorites"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-white text-sm font-semibold"
        >
          View favorites
        </Link>
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-xl"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          Sign out
        </Button>
      </div>
    </main>
  );
}
