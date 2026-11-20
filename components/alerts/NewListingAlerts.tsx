"use client";

import { useNewListingAlerts } from "@/lib/use-new-listing-alerts";

/** App-wide listener: chime + toast when a new property is listed. */
export function NewListingAlerts({ seedIds }: { seedIds?: string[] }) {
  useNewListingAlerts(seedIds ?? []);
  return null;
}
