"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const VIEWER_KEY = "asetena_viewer_id";
const HEARTBEAT_MS = 15_000;

function getViewerId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(VIEWER_KEY);
    if (existing && /^[a-zA-Z0-9_-]{8,80}$/.test(existing)) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID().replace(/-/g, "")
        : `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(VIEWER_KEY, id);
    return id;
  } catch {
    return `tmp${Date.now().toString(36)}`;
  }
}

async function ping(
  propertyId: string,
  viewerId: string,
  action: "heartbeat" | "leave" = "heartbeat"
): Promise<number | null> {
  try {
    const res = await fetch(`/api/v1/properties/${propertyId}/viewers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ viewerId, action }),
      keepalive: action === "leave",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { watching?: number };
    return typeof data.watching === "number" ? data.watching : null;
  } catch {
    return null;
  }
}

export function PeopleWatching({
  propertyId,
  className,
}: {
  propertyId: string;
  className?: string;
}) {
  const [watching, setWatching] = useState<number | null>(null);

  useEffect(() => {
    const viewerId = getViewerId();
    if (!viewerId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    async function beat() {
      const count = await ping(propertyId, viewerId, "heartbeat");
      if (!cancelled && count != null) setWatching(count);
    }

    void beat();
    timer = setInterval(() => {
      void beat();
    }, HEARTBEAT_MS);

    function onHide() {
      if (document.visibilityState === "hidden") {
        void ping(propertyId, viewerId, "leave");
      } else {
        void beat();
      }
    }

    document.addEventListener("visibilitychange", onHide);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onHide);
      void ping(propertyId, viewerId, "leave");
    };
  }, [propertyId]);

  if (watching == null || watching < 1) return null;

  const label =
    watching === 1
      ? "1 person watching now"
      : `${watching} people watching now`;

  return (
    <p
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-[#fff6e8] px-3 py-1.5 text-xs font-semibold text-[#8a5a12]",
        className
      )}
      aria-live="polite"
    >
      <Eye className="size-3.5 shrink-0" aria-hidden />
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#c47a1a] opacity-60" />
        <span className="relative inline-flex size-1.5 rounded-full bg-[#c47a1a]" />
      </span>
      {label}
    </p>
  );
}
