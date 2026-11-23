"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ADVANCE_LABELS,
  STAY_DURATION_OPTIONS,
  formatPricePerMonth,
} from "@/lib/format";
import {
  ADVANCE_OPTIONS,
  BATHROOM_OPTIONS,
  BEDROOM_OPTIONS,
  DEPOSIT_MONTH_OPTIONS,
  MAX_PERSONS_OPTIONS,
  bathroomLabel,
  bedroomLabel,
  depositFromMonths,
  depositMonthsFromAmount,
} from "@/lib/listing-options";
import { EnhancementPartners } from "@/components/mine/EnhancementPartners";
import { FurnishingRadios } from "@/components/property/FurnishingRadios";
import { OptionChipSelect } from "@/components/property/OptionChipSelect";
import { TenancyPanel } from "@/components/rentals/TenancyPanel";
import type {
  ListingAvailability,
  ManagedProperty,
  RentalRequestDto,
} from "@/lib/types";

const AVAILABILITY_LABEL: Record<ListingAvailability, string> = {
  available: "On the market",
  paused: "Paused",
  held: "Held for an applicant",
  rented: "Rented",
};

export function ListingDesk() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [properties, setProperties] = useState<ManagedProperty[] | null>(null);
  const [requests, setRequests] = useState<RentalRequestDto[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status !== "authenticated") return;
    if (session.user.role === "renter") {
      router.push("/profile");
      return;
    }
    Promise.all([
      fetch("/api/v1/me/properties").then((res) => res.json()),
      fetch("/api/v1/me/rentals").then((res) => res.json()),
    ])
      .then(([homes, rentals]) => {
        setProperties(homes.properties ?? []);
        setRequests((rentals.requests ?? []).filter((row: RentalRequestDto) => row.is_landlord));
      })
      .catch(() => toast.error("Could not load your listings"));
  }, [status, session, router]);

  async function setAvailability(id: string, availability: ListingAvailability) {
    setBusy(id);
    try {
      const res = await fetch(`/api/v1/properties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability }),
      });
      if (!res.ok) {
        toast.error("Could not update the listing");
        return;
      }
      setProperties((prev) =>
        prev?.map((item) =>
          item.id === id
            ? {
                ...item,
                availability,
                is_active: availability === "rented" ? false : availability === "available" ? true : item.is_active,
              }
            : item
        ) ?? prev
      );
      toast.success(AVAILABILITY_LABEL[availability]);
    } finally {
      setBusy(null);
    }
  }

  async function act(id: string, action: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/v1/rentals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not update the request");
        return;
      }
      setRequests((prev) => prev.map((row) => (row.id === id ? data.request : row)));
      if (action === "accept" && data.request.kind === "application") {
        setProperties((prev) =>
          prev?.map((item) =>
            item.id === data.request.property_id ? { ...item, availability: "held" } : item
          ) ?? prev
        );
        setRequests((prev) =>
          prev.map((row) =>
            row.property_id === data.request.property_id && row.id !== id && row.status === "requested"
              ? { ...row, status: "declined", landlord_note: "Held for another applicant" }
              : row.id === id
                ? data.request
                : row
          )
        );
      }
      if (action === "complete" && data.request.kind === "application") {
        setProperties((prev) =>
          prev?.map((item) =>
            item.id === data.request.property_id
              ? { ...item, availability: "rented", is_active: false }
              : item
          ) ?? prev
        );
      }
      toast.success("Updated");
    } finally {
      setBusy(null);
    }
  }

  async function saveEdits(property: ManagedProperty, form: FormData) {
    setBusy(property.id);
    try {
      const price = Number(form.get("price"));
      const depositMonths = Number(form.get("depositMonths") ?? 0);
      const res = await fetch(`/api/v1/properties/${property.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(form.get("title") || ""),
          description: String(form.get("description") || ""),
          pricePerMonth: price,
          advancePeriod: String(form.get("advancePeriod") || property.advance_period),
          securityDeposit: depositFromMonths(price, depositMonths),
          digitalAddressGhanapost: String(form.get("address") || "") || null,
          bedrooms: Number(form.get("beds")),
          bathrooms: Number(form.get("baths")),
          stayDuration: String(form.get("stayDuration") || property.stay_duration),
          furnishing: String(form.get("furnishing") || "unfurnished"),
          availableFrom: String(form.get("availableFrom") || "") || null,
          billsElectricity: String(form.get("billsElectricity") || "tenant"),
          billsWater: String(form.get("billsWater") || "tenant"),
          billsInternet: String(form.get("billsInternet") || "tenant"),
          petsAllowed: form.get("petsAllowed") === "on",
          smokingAllowed: form.get("smokingAllowed") === "on",
          maxOccupants: String(form.get("maxOccupants") || "")
            ? Number(form.get("maxOccupants"))
            : null,
          quietHours: String(form.get("quietHours") || "") || null,
          houseRules: String(form.get("houseRules") || "") || null,
          accessInstructions: String(form.get("accessInstructions") || "") || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not save changes");
        return;
      }
      setProperties((prev) =>
        prev?.map((item) =>
          item.id === property.id
            ? {
                ...item,
                title: data.property.title,
                description: data.property.description,
                price_per_month: data.property.price_per_month,
                advance_period: data.property.advance_period,
                security_deposit: data.property.security_deposit,
                digital_address_ghanapost: data.property.digital_address_ghanapost,
                bedrooms: data.property.bedrooms,
                bathrooms: data.property.bathrooms,
                stay_duration: data.property.stay_duration,
                furnishing: data.property.furnishing,
                available_from: data.property.available_from,
                bills_electricity: data.property.bills_electricity,
                bills_water: data.property.bills_water,
                bills_internet: data.property.bills_internet,
                pets_allowed: data.property.pets_allowed,
                smoking_allowed: data.property.smoking_allowed,
                max_occupants: data.property.max_occupants,
                quiet_hours: data.property.quiet_hours,
                house_rules: data.property.house_rules,
                access_instructions: data.property.access_instructions,
              }
            : item
        ) ?? prev
      );
      setEditing(null);
      toast.success("Listing updated");
    } finally {
      setBusy(null);
    }
  }

  async function uploadOwnership(propertyId: string, file: File) {
    setBusy(propertyId);
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("purpose", "ownership");
      const uploaded = await fetch("/api/v1/uploads", { method: "POST", body });
      const uploadData = await uploaded.json().catch(() => ({}));
      if (!uploaded.ok) {
        toast.error(uploadData.error ?? "Upload failed");
        return;
      }
      const res = await fetch(`/api/v1/properties/${propertyId}/ownership`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ landTitleDocumentUrl: uploadData.url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not submit the document");
        return;
      }
      setProperties((prev) =>
        prev?.map((item) =>
          item.id === propertyId
            ? {
                ...item,
                ownership_status: "pending",
                is_direct_owner_verified: false,
                land_title_document_url: uploadData.url,
              }
            : item
        ) ?? prev
      );
      toast.success("Document sent for review");
    } finally {
      setBusy(null);
    }
  }

  if (!properties) {
    return <p className="px-4 py-10 text-center text-sm text-muted-foreground">Loading your homes…</p>;
  }

  const incoming = requests.filter((row) => row.status === "requested" || row.status === "accepted");
  const movedIn = requests.filter((row) => row.status === "completed" && row.kind === "application");

  return (
    <div className="space-y-8 px-4 py-4">
      <section className="space-y-3">
        <h2 className="text-base font-bold text-brand">Requests</h2>
        {incoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open viewing or rental requests.</p>
        ) : (
          <ul className="space-y-3">
            {incoming.map((row) => (
              <li key={row.id} className="rounded-2xl border border-border bg-white p-4">
                <p className="text-sm font-semibold">
                  {row.renter_name} · {row.kind === "tour" ? "Viewing" : "Application"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {row.property_title} · {row.status}
                  {row.viewing_at ? ` · ${new Date(row.viewing_at).toLocaleString()}` : ""}
                  {row.move_in_date ? ` · move-in ${row.move_in_date}` : ""}
                  {row.offered_advance ? ` · ${ADVANCE_LABELS[row.offered_advance]}` : ""}
                </p>
                {row.message ? <p className="mt-2 text-sm">{row.message}</p> : null}
                <TenancyPanel
                  row={row}
                  onRefresh={() => {
                    fetch("/api/v1/me/rentals")
                      .then((res) => res.json())
                      .then((rentals) =>
                        setRequests(
                          (rentals.requests ?? []).filter((item: RentalRequestDto) => item.is_landlord)
                        )
                      )
                      .catch(() => toast.error("Could not refresh requests"));
                  }}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {row.status === "requested" && (
                    <>
                      <Button size="sm" className="rounded-xl" disabled={busy === row.id} onClick={() => act(row.id, "accept")}>
                        Accept
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-xl" disabled={busy === row.id} onClick={() => act(row.id, "decline")}>
                        Decline
                      </Button>
                    </>
                  )}
                  {row.status === "accepted" && row.kind === "application" && row.advance_receipt !== "landlord_confirmed" && (
                    <Button size="sm" variant="outline" className="rounded-xl" disabled={busy === row.id} onClick={() => act(row.id, "confirm_receipt")}>
                      Advance received
                    </Button>
                  )}
                  {row.status === "accepted" && (
                    <Button size="sm" className="rounded-xl" disabled={busy === row.id} onClick={() => act(row.id, "complete")}>
                      {row.kind === "tour" ? "Viewing done" : "Mark moved in"}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {movedIn.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-bold text-brand">After move-in</h2>
          <ul className="space-y-3">
            {movedIn.map((row) => (
              <li key={row.id} className="rounded-2xl border border-border bg-white p-4">
                <p className="text-sm font-semibold">{row.renter_name}</p>
                <p className="text-xs text-muted-foreground">{row.property_title}</p>
                <TenancyPanel
                  row={row}
                  onRefresh={() => {
                    fetch("/api/v1/me/rentals")
                      .then((res) => res.json())
                      .then((rentals) =>
                        setRequests(
                          (rentals.requests ?? []).filter((item: RentalRequestDto) => item.is_landlord)
                        )
                      )
                      .catch(() => toast.error("Could not refresh requests"));
                  }}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <EnhancementPartners
        cityTown={properties[0]?.city_town}
        neighborhood={properties[0]?.neighborhood}
      />

      <section className="space-y-3">
        <h2 className="text-base font-bold text-brand">Your homes</h2>
        {properties.length === 0 ? (
          <p className="text-sm text-muted-foreground">You have not published a home yet.</p>
        ) : (
          <ul className="space-y-3">
            {properties.map((property) => (
              <li key={property.id} className="rounded-2xl border border-border bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{property.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {property.neighborhood}, {property.city_town} · {formatPricePerMonth(property.price_per_month)}
                    </p>
                    <p className="mt-1 text-xs font-medium">
                      {property.availability === "rented"
                        ? "Rented · not live"
                        : property.is_active
                          ? AVAILABILITY_LABEL[property.availability]
                          : "Hidden after reports"}
                      {" · "}
                      {property.listing_actor_type === "agent"
                        ? "Verified agent"
                        : property.listing_actor_type === "firm"
                          ? "Verified firm"
                          : property.is_direct_owner_verified
                            ? "Owner verified"
                            : property.ownership_status === "pending"
                              ? "Ownership under review"
                              : property.ownership_status === "rejected"
                                ? "Ownership rejected"
                                : "Ownership not submitted"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    disabled={busy === property.id || property.availability === "held"}
                    onClick={() => setAvailability(property.id, "available")}
                  >
                    List
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xl" disabled={busy === property.id} onClick={() => setAvailability(property.id, "paused")}>
                    Pause
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xl" disabled={busy === property.id} onClick={() => setAvailability(property.id, "rented")}>
                    Mark rented
                  </Button>
                  <Button size="sm" variant="ghost" className="rounded-xl" onClick={() => setEditing(editing === property.id ? null : property.id)}>
                    Edit
                  </Button>
                </div>
                {editing === property.id && (
                  <form
                    className="mt-4 space-y-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveEdits(property, new FormData(e.currentTarget));
                    }}
                  >
                    <Input name="title" defaultValue={property.title} required className="h-11 rounded-xl" />
                    <Textarea name="description" defaultValue={property.description} required />
                    <Input
                      name="price"
                      type="number"
                      min={1}
                      defaultValue={property.price_per_month}
                      required
                      className="h-11 rounded-xl"
                      placeholder="Monthly rent (GHS)"
                    />
                    <OptionChipSelect
                      name="advancePeriod"
                      legend="Advance / rent length"
                      options={ADVANCE_OPTIONS.map((period) => ({
                        value: period,
                        label: ADVANCE_LABELS[period],
                      }))}
                      defaultValue={property.advance_period}
                      columns={2}
                    />
                    <OptionChipSelect
                      name="depositMonths"
                      legend="Security deposit"
                      hint="Held at move-in; charged at end of stay if needed"
                      options={DEPOSIT_MONTH_OPTIONS.map((o) => ({
                        value: String(o.months),
                        label: o.label,
                      }))}
                      defaultValue={String(
                        depositMonthsFromAmount(
                          property.security_deposit,
                          property.price_per_month
                        )
                      )}
                      columns={2}
                    />
                    <OptionChipSelect
                      name="beds"
                      legend="Bedrooms"
                      options={BEDROOM_OPTIONS.map((n) => ({
                        value: String(n),
                        label: bedroomLabel(n),
                      }))}
                      defaultValue={String(property.bedrooms)}
                      columns={4}
                    />
                    <OptionChipSelect
                      name="baths"
                      legend="Bathrooms"
                      options={BATHROOM_OPTIONS.map((n) => ({
                        value: String(n),
                        label: bathroomLabel(n),
                      }))}
                      defaultValue={String(property.bathrooms)}
                      columns={5}
                    />
                    <Input
                      name="address"
                      defaultValue={property.digital_address_ghanapost ?? ""}
                      placeholder="GhanaPost address"
                      className="h-11 rounded-xl"
                    />
                    <OptionChipSelect
                      name="stayDuration"
                      legend="Stay duration"
                      options={STAY_DURATION_OPTIONS}
                      defaultValue={property.stay_duration ?? "long_stay"}
                      columns={2}
                    />
                    <FurnishingRadios defaultValue={property.furnishing} />
                    <Input name="availableFrom" type="date" defaultValue={property.available_from ?? ""} className="h-11 rounded-xl" />
                    <div className="grid grid-cols-3 gap-2">
                      {(["billsElectricity", "billsWater", "billsInternet"] as const).map((name) => (
                        <select
                          key={name}
                          name={name}
                          defaultValue={
                            name === "billsElectricity"
                              ? property.bills_electricity
                              : name === "billsWater"
                                ? property.bills_water
                                : property.bills_internet
                          }
                          className="h-11 rounded-xl border border-input bg-white px-2 text-xs"
                        >
                          <option value="tenant">{name.replace("bills", "")} tenant</option>
                          <option value="landlord">{name.replace("bills", "")} landlord</option>
                          <option value="shared">{name.replace("bills", "")} shared</option>
                        </select>
                      ))}
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="petsAllowed" defaultChecked={property.pets_allowed} />
                      Pets allowed
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="smokingAllowed" defaultChecked={property.smoking_allowed} />
                      Smoking allowed (off = no smoking)
                    </label>
                    <OptionChipSelect
                      name="maxOccupants"
                      legend="Max persons who can stay"
                      options={MAX_PERSONS_OPTIONS.map((n) => ({
                        value: String(n),
                        label: String(n),
                      }))}
                      defaultValue={String(
                        property.max_occupants && property.max_occupants > 0
                          ? property.max_occupants
                          : Math.max(1, property.bedrooms * 2 || 2)
                      )}
                      columns={5}
                    />
                    <Input name="quietHours" defaultValue={property.quiet_hours ?? ""} placeholder="Quiet hours" className="h-11 rounded-xl" />
                    <Textarea name="houseRules" defaultValue={property.house_rules ?? ""} placeholder="House rules" />
                    <Textarea name="accessInstructions" defaultValue={property.access_instructions ?? ""} placeholder="Access instructions, shown after accept" />
                    <Button type="submit" className="rounded-xl" disabled={busy === property.id}>
                      Save changes
                    </Button>
                  </form>
                )}
                {property.listing_actor_type === "agent" ||
                property.listing_actor_type === "firm" ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {property.listing_actor_type === "firm"
                      ? "Firm listings stay accountable under your firm account."
                      : "Agent listings stay accountable under your agent account."}{" "}
                    Owner land-title verification is for landlord-listed homes.
                  </p>
                ) : (
                  <label className="mt-3 block text-xs text-muted-foreground">
                    Land title or indenture photo
                    <input
                      type="file"
                      accept="image/*"
                      className="mt-1 block w-full text-sm"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadOwnership(property.id, file);
                      }}
                    />
                  </label>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
