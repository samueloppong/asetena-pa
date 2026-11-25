"use client";

import { PropertyImage } from "@/components/property/PropertyImage";
import { FurnishingRadios } from "@/components/property/FurnishingRadios";
import {
  GpsCapturePanel,
  type GpsCapture,
} from "@/components/post/GpsCapturePanel";
import { useEffect, useMemo, useState } from "react";
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  LayoutTemplate,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ADVANCE_LABELS,
  PROPERTY_TYPE_LABELS,
  ROOM_CATEGORY_LABELS,
  STAY_DURATION_OPTIONS,
  formatGhs,
  formatPricePerMonth,
} from "@/lib/format";
import { GHANA_REGIONS, getRegionByName } from "@/lib/ghana-locations";
import { unlockListingChime, playListingChime } from "@/lib/listing-chime";
import {
  ADVANCE_OPTIONS,
  BATHROOM_OPTIONS,
  BEDROOM_OPTIONS,
  DEPOSIT_MONTH_OPTIONS,
  MAX_PERSONS_OPTIONS,
  bathroomLabel,
  bedroomLabel,
  depositFromMonths,
} from "@/lib/listing-options";
import { markPropertySeen } from "@/lib/use-new-listing-alerts";
import type {
  BillPayer,
  Furnishing,
  PaymentFrequency,
  PropertyAmenities,
  PropertyType,
  RoomCategory,
  StayDuration,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { OptionChipSelect } from "@/components/property/OptionChipSelect";

const STEPS = ["Media", "Details", "GPS Check", "Specs", "Review"] as const;

const ROOM_OPTIONS: RoomCategory[] = [
  "exterior",
  "living_room",
  "bedroom",
  "kitchen",
  "bathroom",
  "balcony",
];

const TYPE_OPTIONS: PropertyType[] = [
  "apartment",
  "house",
  "chamber_and_hall",
  "single_room",
];

const AMENITY_FIELDS: {
  key: keyof PropertyAmenities;
  label: string;
}[] = [
  { key: "has_polytank_water", label: "Polytank / 24/7 water" },
  { key: "has_standby_generator", label: "Standby generator" },
  { key: "has_solar", label: "Solar power" },
  { key: "has_air_conditioning", label: "Air conditioning" },
  { key: "is_walled_and_gated", label: "Walled & gated" },
  { key: "has_self_meter", label: "Self ECG prepaid meter" },
  { key: "has_parking_space", label: "Parking space" },
];

type UploadedMedia = {
  mediaUrl: string;
  mediaType: "image" | "video";
  category: RoomCategory;
  displayOrder: number;
};

interface DraftState {
  title: string;
  description: string;
  property_type: PropertyType;
  price_per_month: string;
  deposit_months: string;
  digital_address: string;
  advance_period: PaymentFrequency;
  bedrooms: string;
  bathrooms: string;
  neighborhood: string;
  city_town: string;
  region: string;
  stay_duration: StayDuration;
  furnishing: Furnishing;
  available_from: string;
  bills_electricity: BillPayer;
  bills_water: BillPayer;
  bills_internet: BillPayer;
  pets_allowed: boolean;
  smoking_allowed: boolean;
  max_occupants: string;
  quiet_hours: string;
  house_rules: string;
  amenities: PropertyAmenities;
  media: UploadedMedia[];
}

const defaultDraft: DraftState = {
  title: "",
  description: "",
  property_type: "apartment",
  price_per_month: "",
  deposit_months: "1",
  digital_address: "",
  advance_period: "six_months",
  bedrooms: "1",
  bathrooms: "1",
  neighborhood: "",
  city_town: "Accra",
  region: "Greater Accra",
  stay_duration: "long_stay",
  furnishing: "unfurnished",
  available_from: "",
  bills_electricity: "tenant",
  bills_water: "tenant",
  bills_internet: "tenant",
  pets_allowed: false,
  smoking_allowed: false,
  max_occupants: "2",
  quiet_hours: "",
  house_rules: "",
  amenities: {
    has_polytank_water: true,
    has_standby_generator: false,
    has_solar: false,
    has_air_conditioning: false,
    is_walled_and_gated: true,
    has_self_meter: true,
    has_parking_space: false,
  },
  media: [],
};

export function UploadWizard() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<DraftState>(defaultDraft);
  const [gps, setGps] = useState<GpsCapture | null>(null);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [activeRoom, setActiveRoom] = useState<RoomCategory>("exterior");

  const priceNum = Number(draft.price_per_month) || 0;
  const selectedRegion = getRegionByName(draft.region);

  const canNext = useMemo(() => {
    if (step === 0) return draft.media.length >= 1;
    if (step === 1)
      return (
        draft.title.trim().length > 3 &&
        priceNum > 0 &&
        draft.region.trim().length > 1 &&
        draft.city_town.trim().length > 1 &&
        draft.neighborhood.trim().length > 1 &&
        draft.deposit_months !== "" &&
        Number(draft.max_occupants) >= 1 &&
        Boolean(draft.advance_period)
      );
    if (step === 2) return Boolean(gps?.verified);
    if (step === 3)
      return (
        Number(draft.bedrooms) >= 0 &&
        Number(draft.bathrooms) >= 1 &&
        draft.description.length >= 10
      );
    return true;
  }, [step, draft, priceNum, gps]);

  useEffect(() => {
    if (status === "unauthenticated") {
      toast.message("Sign in as a landlord, agent, or firm to list a home");
      router.push("/login");
    }
  }, [status, router]);

  // If region changes after GPS capture, force re-verify
  useEffect(() => {
    setGps(null);
  }, [draft.region]);

  async function ensureLandlord() {
    if (!session?.user) return false;
    if (session.user.idVerificationStatus !== "verified") {
      toast.message("Verify your Ghana Card before listing");
      router.push("/verify");
      return false;
    }
    if (
      session.user.role === "landlord" ||
      session.user.role === "agent" ||
      session.user.role === "firm" ||
      session.user.role === "admin"
    ) {
      return true;
    }
    const res = await fetch("/api/v1/me/role", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "landlord" }),
    });
    if (!res.ok) {
      toast.error("Could not switch to landlord role");
      return false;
    }
    await update({ role: "landlord" });
    toast.success("Account upgraded to landlord");
    return true;
  }

  async function onFileSelected(fileList: FileList | null) {
    if (!fileList?.length) return;
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }
    setUploading(true);
    try {
      const uploaded: UploadedMedia[] = [];
      for (const file of Array.from(fileList)) {
        const form = new FormData();
        form.append("file", file);
        form.append("category", activeRoom);
        const res = await fetch("/api/v1/uploads", {
          method: "POST",
          body: form,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        uploaded.push({
          mediaUrl: data.url,
          mediaType: data.mediaType,
          category: activeRoom,
          displayOrder: draft.media.length + uploaded.length,
        });
      }
      setDraft((prev) => ({ ...prev, media: [...prev.media, ...uploaded] }));
      toast.success(`${uploaded.length} photo(s) uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function publish() {
    if (!gps?.verified) {
      toast.error("GPS verification is required before publishing");
      setStep(2);
      return;
    }
    const depositMonths = Number(draft.deposit_months);
    if (
      draft.deposit_months === "" ||
      Number.isNaN(depositMonths) ||
      depositMonths < 0
    ) {
      toast.error("Select a security deposit option");
      setStep(1);
      return;
    }
    const deposit = depositFromMonths(priceNum, depositMonths);
    const maxOccupants = Number(draft.max_occupants);
    if (!draft.max_occupants || Number.isNaN(maxOccupants) || maxOccupants < 1) {
      toast.error("Select the maximum number of persons who can stay");
      setStep(1);
      return;
    }
    const address = draft.digital_address.trim().toUpperCase();
    if (address && !/^[A-Z]{2}-\d{3,4}-\d{4}$/.test(address)) {
      toast.error("GhanaPost address should look like GA-183-4921");
      setStep(1);
      return;
    }
    setPublishing(true);
    try {
      const ok = await ensureLandlord();
      if (!ok) {
        setPublishing(false);
        return;
      }

      const res = await fetch("/api/v1/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          description: draft.description,
          propertyType: draft.property_type,
          pricePerMonth: priceNum,
          advancePeriod: draft.advance_period,
          securityDeposit: deposit,
          digitalAddressGhanapost: address || null,
          region: draft.region,
          cityTown: draft.city_town,
          neighborhood: draft.neighborhood,
          bedrooms: Number(draft.bedrooms),
          bathrooms: Number(draft.bathrooms),
          latitude: gps.latitude,
          longitude: gps.longitude,
          locationAccuracyMeters: gps.accuracyMeters,
          amenities: {
            hasPolytankWater: draft.amenities.has_polytank_water,
            hasStandbyGenerator: draft.amenities.has_standby_generator,
            hasSolar: draft.amenities.has_solar,
            hasAirConditioning: draft.amenities.has_air_conditioning,
            isWalledAndGated: draft.amenities.is_walled_and_gated,
            hasSelfMeter: draft.amenities.has_self_meter,
            hasParkingSpace: draft.amenities.has_parking_space,
          },
          stayDuration: draft.stay_duration,
          furnishing: draft.furnishing,
          availableFrom: draft.available_from || null,
          billsElectricity: draft.bills_electricity,
          billsWater: draft.bills_water,
          billsInternet: draft.bills_internet,
          petsAllowed: draft.pets_allowed,
          smokingAllowed: draft.smoking_allowed,
          maxOccupants,
          quietHours: draft.quiet_hours || null,
          houseRules: draft.house_rules || null,
          media: draft.media,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "KYC_REQUIRED") {
          toast.message("Verify your Ghana Card before listing");
          router.push("/verify");
          setPublishing(false);
          return;
        }
        toast.error(data.error || "Publish failed");
        setPublishing(false);
        return;
      }
      toast.success("Listing published with verified GPS");
      unlockListingChime();
      playListingChime();
      if (data.property?.id) markPropertySeen(data.property.id);
      router.push(`/properties/${data.property.id}`);
      router.refresh();
    } catch {
      toast.error("Publish failed");
    } finally {
      setPublishing(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="px-4 py-16 text-center text-sm text-muted-foreground">
        Checking session…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-6">
      <Link
        href="/post/studio"
        className="flex items-center gap-3 rounded-2xl border border-gold/50 bg-accent px-4 py-3 text-sm transition hover:border-gold"
      >
        <LayoutTemplate className="size-5 shrink-0 text-brand" />
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-brand">Try the drag &amp; drop Listing Studio</span>
          <span className="block text-xs text-muted-foreground">
            Build your listing card visually — best on a larger screen.
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-brand" />
      </Link>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-extrabold tracking-tight text-brand">
            List Your Property
          </h1>
          <span className="text-xs font-medium text-muted-foreground">
            Step {step + 1}/{STEPS.length}
          </span>
        </div>
        <div className="flex gap-1.5">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-secondary"
              )}
              title={label}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{STEPS[step]}</p>
      </div>

      {step === 0 && (
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {ROOM_OPTIONS.map((room) => (
              <button
                key={room}
                type="button"
                onClick={() => setActiveRoom(room)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium",
                  activeRoom === room
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-white"
                )}
              >
                {ROOM_CATEGORY_LABELS[room]}
              </button>
            ))}
          </div>

          <label className="flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-border bg-white p-8 text-center">
            <Camera className="size-8 text-primary" />
            <p className="mt-3 text-sm font-medium">
              Upload {ROOM_CATEGORY_LABELS[activeRoom]} photos
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              JPG/PNG up to 15MB
            </p>
            <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-primary">
              <Upload className="size-3.5" />
              {uploading ? "Uploading…" : "Choose files"}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(e) => onFileSelected(e.target.files)}
            />
          </label>

          {draft.media.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {draft.media.map((m) => (
                <div
                  key={m.mediaUrl}
                  className="relative aspect-square overflow-hidden rounded-xl border border-border"
                >
                  <PropertyImage
                    src={m.mediaUrl}
                    alt={m.category}
                    fill
                    className="object-cover"
                  />
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-white">
                    {ROOM_CATEGORY_LABELS[m.category]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {step === 1 && (
        <section className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Listing title</Label>
            <Input
              id="title"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="e.g. Modern 2-Bedroom in East Legon"
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Property type</Label>
            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDraft({ ...draft, property_type: type })}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium",
                    draft.property_type === type
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-white"
                  )}
                >
                  {PROPERTY_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          <OptionChipSelect
            legend="Stay duration"
            hint="Long stay is the default for rentals. Short stay is for nights or weeks."
            options={STAY_DURATION_OPTIONS}
            value={draft.stay_duration}
            onChange={(stay_duration) =>
              setDraft({
                ...draft,
                stay_duration: stay_duration as StayDuration,
                furnishing:
                  stay_duration === "short_stay"
                    ? "furnished"
                    : draft.furnishing,
              })
            }
            columns={2}
          />

          <div className="space-y-2">
            <Label htmlFor="region">Region (all 16)</Label>
            <select
              id="region"
              value={draft.region}
              onChange={(e) => {
                const region = e.target.value;
                const meta = getRegionByName(region);
                setDraft({
                  ...draft,
                  region,
                  city_town: meta?.cities[0] ?? "",
                  neighborhood: "",
                });
              }}
              className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm"
            >
              {GHANA_REGIONS.map((region) => (
                <option key={region.name} value={region.name}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="city">City / Town</Label>
              <select
                id="city"
                value={draft.city_town}
                onChange={(e) =>
                  setDraft({ ...draft, city_town: e.target.value })
                }
                className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm"
              >
                {(selectedRegion?.cities ?? []).map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Monthly rent (GHS)</Label>
              <Input
                id="price"
                type="number"
                min={0}
                value={draft.price_per_month}
                onChange={(e) =>
                  setDraft({ ...draft, price_per_month: e.target.value })
                }
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          <OptionChipSelect
            legend="Security deposit"
            hint={
              priceNum > 0
                ? `Held at move-in. Selected: ${
                    DEPOSIT_MONTH_OPTIONS.find(
                      (o) => String(o.months) === draft.deposit_months
                    )?.label ?? ""
                  }${
                    Number(draft.deposit_months) > 0
                      ? ` (${formatGhs(depositFromMonths(priceNum, Number(draft.deposit_months)))})`
                      : ""
                  }. Charged at end of stay if there is damage or unpaid bills.`
                : "Held at move-in. Amount is months of rent — enter monthly rent first to see GHS."
            }
            options={DEPOSIT_MONTH_OPTIONS.map((o) => ({
              value: String(o.months),
              label: o.label,
            }))}
            value={draft.deposit_months}
            onChange={(deposit_months) => setDraft({ ...draft, deposit_months })}
            columns={2}
          />

          <div className="space-y-2">
            <Label htmlFor="ghanapost">GhanaPost address</Label>
            <Input
              id="ghanapost"
              value={draft.digital_address}
              onChange={(e) =>
                setDraft({ ...draft, digital_address: e.target.value })
              }
              placeholder="GA-183-4921"
              className="h-11 rounded-xl"
            />
          </div>

          <FurnishingRadios
            value={draft.furnishing}
            onChange={(furnishing) => setDraft({ ...draft, furnishing })}
          />
          <div className="space-y-2">
            <Label htmlFor="available-from">Free from</Label>
            <Input
              id="available-from"
              type="date"
              value={draft.available_from}
              onChange={(e) => setDraft({ ...draft, available_from: e.target.value })}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["bills_electricity", "ECG"],
                ["bills_water", "Water"],
                ["bills_internet", "Internet"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <select
                  value={draft[key]}
                  onChange={(e) => setDraft({ ...draft, [key]: e.target.value as BillPayer })}
                  className="h-11 w-full rounded-xl border border-input bg-white px-2 text-xs"
                >
                  <option value="tenant">Tenant</option>
                  <option value="landlord">Landlord</option>
                  <option value="shared">Shared</option>
                </select>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.pets_allowed}
                onChange={(e) => setDraft({ ...draft, pets_allowed: e.target.checked })}
              />
              Pets allowed
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.smoking_allowed}
                onChange={(e) => setDraft({ ...draft, smoking_allowed: e.target.checked })}
              />
              Smoking allowed (off = no smoking)
            </label>
          </div>
          <OptionChipSelect
            legend="Max persons who can stay"
            options={MAX_PERSONS_OPTIONS.map((n) => ({
              value: String(n),
              label: String(n),
            }))}
            value={draft.max_occupants}
            onChange={(max_occupants) => setDraft({ ...draft, max_occupants })}
            columns={5}
          />
          <div className="space-y-2">
            <Label htmlFor="quiet-hours">Quiet hours</Label>
            <Input
              id="quiet-hours"
              value={draft.quiet_hours}
              onChange={(e) => setDraft({ ...draft, quiet_hours: e.target.value })}
              placeholder="e.g. 10pm–6am"
              className="h-11 rounded-xl"
            />
          </div>
          {draft.stay_duration === "short_stay" && (
            <p className="text-[11px] text-muted-foreground">
              Short stays default to furnished — change the radio above if needed.
            </p>
          )}
          <Textarea
            value={draft.house_rules}
            onChange={(e) => setDraft({ ...draft, house_rules: e.target.value })}
            placeholder="House rules"
            maxLength={1000}
          />

          <div className="space-y-2">
            <Label htmlFor="neighborhood">Neighborhood</Label>
            <Input
              id="neighborhood"
              list="neighborhood-suggestions"
              value={draft.neighborhood}
              onChange={(e) =>
                setDraft({ ...draft, neighborhood: e.target.value })
              }
              placeholder="East Legon, Ahodwo…"
              className="h-11 rounded-xl"
            />
            <datalist id="neighborhood-suggestions">
              {(selectedRegion?.neighborhoods ?? []).map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </div>

          <OptionChipSelect
            legend="Advance / rent length"
            hint="How much rent tenants must pay upfront"
            options={ADVANCE_OPTIONS.map((period) => ({
              value: period,
              label: ADVANCE_LABELS[period],
            }))}
            value={draft.advance_period}
            onChange={(advance_period) =>
              setDraft({
                ...draft,
                advance_period: advance_period as PaymentFrequency,
              })
            }
            columns={2}
          />
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4">
          <GpsCapturePanel
            claimedRegion={draft.region}
            value={gps}
            onChange={setGps}
          />
          <p className="text-xs text-muted-foreground">
            Tip: stand at the building entrance, enable high-accuracy GPS, then
            tap Detect. Listings cannot publish without a matching GPS pin.
          </p>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4">
          <OptionChipSelect
            legend="Bedrooms"
            options={BEDROOM_OPTIONS.map((n) => ({
              value: String(n),
              label: bedroomLabel(n),
            }))}
            value={draft.bedrooms}
            onChange={(bedrooms) => setDraft({ ...draft, bedrooms })}
            columns={4}
          />
          <OptionChipSelect
            legend="Bathrooms"
            options={BATHROOM_OPTIONS.map((n) => ({
              value: String(n),
              label: bathroomLabel(n),
            }))}
            value={draft.bathrooms}
            onChange={(bathrooms) => setDraft({ ...draft, bathrooms })}
            columns={5}
          />
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              rows={4}
              value={draft.description}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
              placeholder="Highlight water, power, and what makes this home unique…"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-3">
            <Label>Amenities</Label>
            <ul className="space-y-2">
              {AMENITY_FIELDS.map(({ key, label }) => (
                <li
                  key={key}
                  className="flex items-center gap-3 rounded-xl border border-border bg-white px-3 py-3"
                >
                  <Checkbox
                    checked={draft.amenities[key]}
                    onCheckedChange={(checked) =>
                      setDraft({
                        ...draft,
                        amenities: {
                          ...draft.amenities,
                          [key]: checked === true,
                        },
                      })
                    }
                  />
                  <span className="text-sm">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="space-y-4 rounded-2xl border border-border bg-white p-5">
          <h2 className="text-lg font-bold text-brand">
            {draft.title || "Untitled"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {PROPERTY_TYPE_LABELS[draft.property_type]} · {draft.neighborhood},{" "}
            {draft.city_town} · {draft.region}
          </p>
          <p className="text-base font-bold text-primary">
            {priceNum > 0 ? formatPricePerMonth(priceNum) : "—"}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {ADVANCE_LABELS[draft.advance_period]}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            {bedroomLabel(Number(draft.bedrooms))} ·{" "}
            {bathroomLabel(Number(draft.bathrooms))} · up to{" "}
            {draft.max_occupants} persons ·{" "}
            {Number(draft.deposit_months) > 0
              ? `deposit ${formatGhs(depositFromMonths(priceNum, Number(draft.deposit_months)))}`
              : "no deposit"}{" "}
            · {draft.media.length} photos
          </p>
          {gps?.verified && (
            <p className="text-xs font-medium text-verified">
              GPS verified: {gps.latitude.toFixed(5)}, {gps.longitude.toFixed(5)}
            </p>
          )}
          {draft.description && (
            <p className="text-sm leading-relaxed text-foreground">
              {draft.description}
            </p>
          )}
          <p className="inline-flex items-center gap-1 text-xs text-verified">
            <Check className="size-3.5" />
            Ready to publish
          </p>
        </section>
      )}

      <div className="flex gap-2 pt-2">
        {step > 0 && (
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1 rounded-xl"
            onClick={() => setStep((s) => s - 1)}
          >
            <ChevronLeft className="size-4" />
            Back
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            className="h-11 flex-1 rounded-xl"
            disabled={!canNext || uploading}
            onClick={() => setStep((s) => s + 1)}
          >
            Continue
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button
            type="button"
            className="h-11 flex-1 rounded-xl"
            disabled={publishing || !gps?.verified}
            onClick={publish}
          >
            {publishing ? "Publishing…" : "Publish Listing"}
          </Button>
        )}
      </div>
    </div>
  );
}
