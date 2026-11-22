import type { ListingActorType, UserRole } from "@/lib/types";

/** Roles that can list homes and manage lettings on the platform. */
export function canListProperties(role: UserRole | string | undefined | null): boolean {
  return (
    role === "landlord" ||
    role === "agent" ||
    role === "firm" ||
    role === "admin"
  );
}

export function listingActorFromRole(
  role: UserRole | string | undefined | null
): ListingActorType {
  if (role === "agent") return "agent";
  if (role === "firm") return "firm";
  return "owner";
}

export function listingHostLabel(actor: ListingActorType | undefined | null): string {
  if (actor === "agent") return "Verified agent";
  if (actor === "firm") return "Verified firm";
  return "Landlord";
}

export function listingHostVerifiedLabel(
  actor: ListingActorType | undefined | null
): string {
  if (actor === "agent") return "Verified agent";
  if (actor === "firm") return "Verified firm";
  return "Verified owner";
}

export const ROLE_OPTION_LABELS: Record<
  "renter" | "landlord" | "agent" | "firm",
  string
> = {
  renter: "Renter",
  landlord: "Landlord",
  agent: "Agent",
  firm: "Firm",
};
