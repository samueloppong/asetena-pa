"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { fetchProperties } from "@/lib/api-client";
import {
  bindListingChimeUnlock,
  playListingChime,
} from "@/lib/listing-chime";
import { matchesSavedSearch, readSavedSearch } from "@/lib/saved-search";
import type { Property } from "@/lib/types";

const STORAGE_KEY = "sheltergh:seen-property-ids";
const POLL_MS = 12_000;
export const NEW_LISTINGS_EVENT = "sheltergh:new-listings";

function readSeen(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const ids = JSON.parse(raw) as string[];
    return new Set(Array.isArray(ids) ? ids : []);
  } catch {
    return new Set();
  }
}

function writeSeen(ids: Set<string>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore quota */
  }
}

/** Mark a listing as already known so the publisher doesn't double-chime. */
export function markPropertySeen(id: string) {
  if (typeof window === "undefined" || !id) return;
  const seen = readSeen();
  seen.add(id);
  writeSeen(seen);
}

function announce(properties: Property[]) {
  playListingChime();
  const first = properties[0];
  const where = first
    ? `${first.neighborhood}, ${first.city_town}`
    : "Ghana";
  toast.message(
    properties.length === 1 ? "New home just listed" : "New homes just listed",
    {
      description:
        properties.length === 1
          ? `${first.title} · ${where}`
          : `${properties.length} new listings · including ${where}`,
      duration: 6000,
    }
  );
  window.dispatchEvent(
    new CustomEvent(NEW_LISTINGS_EVENT, { detail: properties })
  );
}

/**
 * Polls for newly listed properties and fires an UberEats-style chime + toast.
 * Seeds seen IDs from `seedIds` (first mount only) without alerting.
 */
export function useNewListingAlerts(seedIds: string[] = []) {
  const seedRef = useRef(seedIds);

  useEffect(() => bindListingChimeUnlock(), []);

  useEffect(() => {
    let cancelled = false;
    const seen = readSeen();
    let primed = seen.size > 0;

    for (const id of seedRef.current) seen.add(id);
    if (seedRef.current.length) {
      writeSeen(seen);
      primed = true;
    }

    async function poll() {
      try {
        const list = await fetchProperties();
        if (cancelled) return;

        if (!primed) {
          for (const p of list) seen.add(p.id);
          writeSeen(seen);
          primed = true;
          return;
        }

        const fresh = list.filter((p) => !seen.has(p.id));
        if (fresh.length === 0) return;

        for (const p of fresh) seen.add(p.id);
        writeSeen(seen);
        const saved = readSavedSearch();
        const matching = saved ? fresh.filter((property) => matchesSavedSearch(property, saved)) : fresh;
        if (matching.length) announce(matching);
      } catch {
        /* network blip — try again next interval */
      }
    }

    void poll();
    const timer = window.setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);
}
