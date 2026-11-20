"use client";

import { useState } from "react";
import { Crosshair, Loader2, MapPinCheck, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { verifyListingGps } from "@/lib/ghana-locations";
import { cn } from "@/lib/utils";

export type GpsCapture = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  verified: boolean;
  detectedRegion?: string;
  message: string;
};

interface GpsCapturePanelProps {
  claimedRegion: string;
  value: GpsCapture | null;
  onChange: (value: GpsCapture | null) => void;
}

export function GpsCapturePanel({
  claimedRegion,
  value,
  onChange,
}: GpsCapturePanelProps) {
  const [busy, setBusy] = useState(false);

  function capture() {
    if (!claimedRegion.trim()) {
      toast.error("Select a Ghana region first");
      return;
    }
    if (!navigator.geolocation) {
      toast.error("GPS is not available on this device");
      return;
    }

    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        const accuracyMeters = pos.coords.accuracy;
        const check = verifyListingGps({
          latitude,
          longitude,
          claimedRegion,
        });

        const next: GpsCapture = {
          latitude,
          longitude,
          accuracyMeters,
          verified: check.ok,
          detectedRegion: check.detectedRegion,
          message: check.message,
        };
        onChange(next);
        setBusy(false);

        if (check.ok) toast.success(check.message);
        else toast.error(check.message);
      },
      (err) => {
        setBusy(false);
        onChange(null);
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Allow GPS to verify the building."
            : "Could not read GPS. Try again at the property."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  }

  return (
    <div
      className={cn(
        "space-y-3 rounded-2xl border p-4",
        value?.verified
          ? "border-emerald-200 bg-emerald-50/60"
          : "border-border bg-white"
      )}
    >
      <div className="flex items-start gap-3">
        {value?.verified ? (
          <MapPinCheck className="mt-0.5 size-5 text-verified" />
        ) : (
          <ShieldAlert className="mt-0.5 size-5 text-amber-600" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            On-site GPS verification
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Capture location while you are at the building. Coordinates must fall
            inside Ghana and match the selected region ({claimedRegion || "—"}).
          </p>
        </div>
      </div>

      {value && (
        <div className="rounded-xl bg-secondary/70 px-3 py-2 text-xs text-foreground">
          <p>
            {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
            {value.accuracyMeters
              ? ` · ±${Math.round(value.accuracyMeters)}m`
              : ""}
          </p>
          <p
            className={cn(
              "mt-1 font-medium",
              value.verified ? "text-verified" : "text-amber-700"
            )}
          >
            {value.message}
          </p>
        </div>
      )}

      <Button
        type="button"
        variant={value?.verified ? "outline" : "default"}
        className="h-11 w-full rounded-xl"
        disabled={busy}
        onClick={capture}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Crosshair className="size-4" />
        )}
        {busy
          ? "Detecting GPS…"
          : value
            ? "Recapture GPS"
            : "Detect building GPS"}
      </Button>
    </div>
  );
}
