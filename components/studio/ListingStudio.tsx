"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  FilePlus2,
  Loader2,
  Redo2,
  Save,
  Trash2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import type { GpsCapture } from "@/components/post/GpsCapturePanel";
import {
  DetailsPanel,
  type ChecklistItem,
} from "@/components/studio/DetailsPanel";
import { FeaturePalette } from "@/components/studio/FeaturePalette";
import { PropertyCard } from "@/components/property/PropertyCard";
import {
  ListingCanvas,
  type PendingPhoto,
} from "@/components/studio/ListingCanvas";
import {
  MAX_PHOTOS,
  clearStoredDraft,
  defaultCanvas,
  defaultDetails,
  loadStoredDraft,
  saveDraft,
  useCanvasHistory,
  withFeatureAdded,
  withFeatureRemoved,
  withFeatureStepped,
  type StudioDetails,
  type StudioPhoto,
} from "@/components/studio/studio-state";
import { FURNISHING_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/format";
import { getRegionByName } from "@/lib/ghana-locations";
import { depositFromMonths } from "@/lib/listing-options";
import { playListingChime, unlockListingChime } from "@/lib/listing-chime";
import {
  FEATURE_BY_KEY,
  featureCountLabel,
  totalFeatureUnits,
  type FeatureKey,
} from "@/lib/listing-features";
import { markPropertySeen } from "@/lib/use-new-listing-alerts";
import type { Property, RoomCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

function agoLabel(savedAt: number | null, now: number) {
  if (!savedAt) return "not saved yet";
  const secs = Math.max(Math.round((now - savedAt) / 1000), 0);
  if (secs < 10) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-white text-brand shadow-sm transition hover:border-gold disabled:opacity-40 disabled:hover:border-border"
    >
      {children}
    </button>
  );
}

function StudioWorkspace({ onNewListing }: { onNewListing: () => void }) {
  const router = useRouter();
  const { data: session, update } = useSession();

  const [initial] = useState(loadStoredDraft);
  const [details, setDetails] = useState<StudioDetails>(
    initial?.details ?? defaultDetails,
  );
  const { canvas, commit, undo, redo, canUndo, canRedo } = useCanvasHistory(
    initial?.canvas ?? defaultCanvas,
  );
  const [gps, setGps] = useState<GpsCapture | null>(null);
  const [photoRoom, setPhotoRoom] = useState<RoomCategory>("exterior");
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  const [preview, setPreview] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedProperty, setPublishedProperty] = useState<Property | null>(
    null,
  );
  const [savedAt, setSavedAt] = useState<number | null>(
    initial?.savedAt ?? null,
  );
  const [now, setNow] = useState(() => Date.now());
  const published = useRef(false);

  const { features, photos } = canvas;
  const bedrooms = features.bedroom ?? 0;
  const bathrooms = features.bathroom ?? 0;
  const priceNum = Number(details.price) || 0;
  const featureUnits = totalFeatureUnits(features);

  const role = session?.user?.role;
  const verifiedLabel =
    session?.user?.idVerificationStatus !== "verified"
      ? "ID not verified"
      : role === "agent"
        ? "Verified Agent"
        : role === "firm"
          ? "Verified Firm"
          : "Verified Owner";

  const locationLabel = [details.neighborhood, details.city, details.region]
    .filter(Boolean)
    .join(", ");

  // Autosave the draft shortly after the last change.
  useEffect(() => {
    if (published.current) return;
    const timer = setTimeout(() => setSavedAt(saveDraft(details, canvas)), 700);
    return () => clearTimeout(timer);
  }, [details, canvas]);

  // Keep the "saved … ago" label fresh.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (initial) toast.message("Restored your saved draft");
  }, [initial]);

  const checklist: ChecklistItem[] = useMemo(
    () => [
      { label: "At least one photo", done: photos.length >= 1 },
      { label: "Listing title", done: details.title.trim().length > 3 },
      { label: "Monthly rent", done: priceNum > 0 },
      { label: "Neighbourhood", done: details.neighborhood.trim().length > 1 },
      { label: "At least one bathroom", done: bathrooms >= 1 },
      {
        label: "Description (10+ characters)",
        done: details.description.trim().length >= 10,
      },
      { label: "GPS location verified", done: Boolean(gps?.verified) },
    ],
    [photos.length, details, priceNum, bathrooms, gps],
  );
  const firstMissing = checklist.find((c) => !c.done);

  function patch(next: Partial<StudioDetails>) {
    setDetails((d) => ({ ...d, ...next }));
  }

  function changeRegion(region: string) {
    const meta = getRegionByName(region);
    patch({ region, city: meta?.cities[0] ?? "", neighborhood: "" });
    // A GPS pin only counts for the region it was verified against.
    setGps(null);
  }

  function addFeature(key: FeatureKey) {
    commit((c) => withFeatureAdded(c, key));
    const def = FEATURE_BY_KEY[key];
    toast.success(`${def.label} added`, { duration: 1200 });
  }

  async function uploadFiles(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) {
      toast.error("Drop image files (JPG or PNG)");
      return;
    }
    const room = Math.max(MAX_PHOTOS - photos.length - pending.length, 0);
    if (room === 0) {
      toast.error(`You can add up to ${MAX_PHOTOS} photos`);
      return;
    }
    const batch = images.slice(0, room);
    if (batch.length < images.length) {
      toast.message(
        `Only the first ${batch.length} photo(s) were added (limit ${MAX_PHOTOS})`,
      );
    }

    const entries = batch.map((file) => ({
      id: crypto.randomUUID(),
      preview: URL.createObjectURL(file),
      file,
    }));
    setPending((p) => [
      ...p,
      ...entries.map(({ id, preview: url }) => ({ id, preview: url })),
    ]);

    await Promise.all(
      entries.map(async ({ id, preview: url, file }) => {
        try {
          const form = new FormData();
          form.append("file", file);
          form.append("category", photoRoom);
          const res = await fetch("/api/v1/uploads", {
            method: "POST",
            body: form,
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Upload failed");
          const photo: StudioPhoto = { id, url: data.url, category: photoRoom };
          commit((c) => ({ ...c, photos: [...c.photos, photo] }));
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Upload failed");
        } finally {
          setPending((p) => p.filter((x) => x.id !== id));
          URL.revokeObjectURL(url);
        }
      }),
    );
  }

  function makeCover(id: string) {
    commit((c) => {
      const photo = c.photos.find((p) => p.id === id);
      if (!photo || c.photos[0]?.id === id) return c;
      return { ...c, photos: [photo, ...c.photos.filter((p) => p.id !== id)] };
    });
  }

  function removePhoto(id: string) {
    const index = photos.findIndex((p) => p.id === id);
    const removed = photos[index];
    if (!removed) return;
    commit((c) => ({ ...c, photos: c.photos.filter((p) => p.id !== id) }));
    toast("Photo removed", {
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () =>
          // Put it back exactly where it was, whatever else changed since.
          commit((c) => {
            if (c.photos.some((p) => p.id === removed.id)) return c;
            const next = [...c.photos];
            next.splice(Math.min(index, next.length), 0, removed);
            return { ...c, photos: next };
          }),
      },
    });
  }

  function writeDescription() {
    const parts = (Object.keys(features) as FeatureKey[])
      .filter((k) => (features[k] ?? 0) > 0)
      .map((k) => featureCountLabel(k, features[k] ?? 0).toLowerCase());
    const place = details.neighborhood || details.city;
    const list =
      parts.length > 1
        ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`
        : parts[0];
    const text = [
      `${PROPERTY_TYPE_LABELS[details.propertyType]} in ${place}${list ? ` with ${list}` : ""}.`,
      `${FURNISHING_LABELS[details.furnishing]}${details.billsIncluded ? ", bills included" : ""}.`,
      details.amenities.has_standby_generator
        ? "Standby generator for reliable power."
        : "",
      details.amenities.has_polytank_water ? "Polytank water on site." : "",
      details.amenities.is_walled_and_gated ? "Walled and gated compound." : "",
    ]
      .filter(Boolean)
      .join(" ");
    patch({ description: text });
  }

  function saveNow() {
    setSavedAt(saveDraft(details, canvas));
    setNow(Date.now());
    toast.success("Draft saved");
  }

  async function ensureLandlord() {
    if (!session?.user) return false;
    if (session.user.idVerificationStatus !== "verified") {
      toast.message("Verify your Ghana Card before listing");
      router.push("/verify");
      return false;
    }
    if (["landlord", "agent", "firm", "admin"].includes(session.user.role)) {
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

  async function publish() {
    if (firstMissing) {
      toast.error(`Still needed: ${firstMissing.label.toLowerCase()}`);
      return;
    }
    if (!gps?.verified) return;
    const address = details.digitalAddress.trim().toUpperCase();
    if (address && !/^[A-Z]{2}-\d{3,4}-\d{4}$/.test(address)) {
      toast.error("GhanaPost address should look like GA-183-4921");
      return;
    }
    const maxOccupants =
      Number(details.maxOccupants) || Math.max(bedrooms * 2, 2);
    const deposit = depositFromMonths(priceNum, Number(details.depositMonths));
    const billPayer = details.billsIncluded ? "landlord" : "tenant";

    setPublishing(true);
    try {
      if (!(await ensureLandlord())) return;

      const res = await fetch("/api/v1/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: details.title.trim(),
          description: details.description.trim(),
          propertyType: details.propertyType,
          pricePerMonth: priceNum,
          advancePeriod: details.advance,
          securityDeposit: deposit,
          digitalAddressGhanapost: address || null,
          region: details.region,
          cityTown: details.city,
          neighborhood: details.neighborhood.trim(),
          bedrooms,
          bathrooms,
          latitude: gps.latitude,
          longitude: gps.longitude,
          locationAccuracyMeters: gps.accuracyMeters,
          amenities: {
            hasPolytankWater: details.amenities.has_polytank_water,
            hasStandbyGenerator: details.amenities.has_standby_generator,
            hasSolar: details.amenities.has_solar,
            hasAirConditioning: details.amenities.has_air_conditioning,
            isWalledAndGated: details.amenities.is_walled_and_gated,
            hasSelfMeter: details.amenities.has_self_meter,
            hasParkingSpace:
              (features.parking ?? 0) + (features.garage ?? 0) > 0,
          },
          stayDuration: details.stayDuration,
          furnishing: details.furnishing,
          availableFrom: details.availableFrom || null,
          billsElectricity: billPayer,
          billsWater: billPayer,
          billsInternet: billPayer,
          petsAllowed: details.petsAllowed,
          smokingAllowed: details.smokingAllowed,
          maxOccupants,
          features,
          media: photos.map((p, i) => ({
            mediaUrl: p.url,
            mediaType: "image",
            category: p.category,
            displayOrder: i,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "KYC_REQUIRED") {
          toast.message("Verify your Ghana Card before listing");
          router.push("/verify");
          return;
        }
        toast.error(data.error || "Publish failed");
        return;
      }
      published.current = true;
      clearStoredDraft();
      toast.success("Listing published with verified GPS");
      unlockListingChime();
      playListingChime();
      if (data.property?.id) markPropertySeen(data.property.id);
      // Show the listing exactly as renters see it in search results.
      setPublishedProperty(data.property as Property);
      window.scrollTo({ top: 0, behavior: "smooth" });
      router.refresh();
    } catch {
      toast.error("Publish failed");
    } finally {
      setPublishing(false);
    }
  }

  const hasContent =
    photos.length > 0 ||
    pending.length > 0 ||
    Boolean(
      details.title.trim() || details.description.trim() || details.price,
    ) ||
    JSON.stringify(features) !== JSON.stringify(defaultCanvas.features);

  function resetEverything() {
    published.current = true; // stop the autosave from re-saving the old draft
    clearStoredDraft();
    onNewListing();
  }

  function startNew() {
    if (!hasContent) {
      resetEverything();
      toast.success("Fresh listing started");
      return;
    }
    // The current draft is dropped, but it can be brought back with Undo.
    const snapshot = { details, canvas, savedAt: Date.now() };
    resetEverything();
    toast("Started a new listing", {
      duration: 6000,
      action: {
        label: "Restore previous",
        onClick: () => {
          saveDraft(snapshot.details, snapshot.canvas);
          onNewListing();
        },
      },
    });
  }

  function discardDraft() {
    if (
      !window.confirm(
        "Delete this listing draft? Photos and details will be cleared.",
      )
    )
      return;
    const snapshot = { details, canvas };
    resetEverything();
    toast("Listing deleted", {
      duration: 6000,
      action: {
        label: "Undo",
        onClick: () => {
          saveDraft(snapshot.details, snapshot.canvas);
          onNewListing();
        },
      },
    });
  }

  /** The draft as the same `Property` the public cards use, so preview == published look. */
  const draftProperty: Property = useMemo(() => {
    const actor =
      role === "agent" ? "agent" : role === "firm" ? "firm" : "owner";
    const verified = session?.user?.idVerificationStatus === "verified";
    return {
      id: "preview",
      landlord: {
        id: session?.user?.id ?? "me",
        email: "",
        phone_number: "",
        full_name: session?.user?.name ?? "",
        role: role ?? "landlord",
        id_verification_status: verified ? "verified" : "unverified",
      },
      title: details.title.trim() || "Untitled listing",
      description:
        details.description.trim() ||
        "Add a description to tell renters about this home.",
      property_type: details.propertyType,
      price_per_month: priceNum,
      advance_period: details.advance,
      security_deposit: depositFromMonths(
        priceNum,
        Number(details.depositMonths),
      ),
      region: details.region,
      city_town: details.city,
      neighborhood: details.neighborhood.trim(),
      bedrooms,
      bathrooms,
      is_direct_owner_verified: verified && actor === "owner",
      listing_actor_type: actor,
      ownership_status: "none",
      availability: "available",
      stay_duration: details.stayDuration,
      furnishing: details.furnishing,
      available_from: details.availableFrom || undefined,
      bills_electricity: details.billsIncluded ? "landlord" : "tenant",
      bills_water: details.billsIncluded ? "landlord" : "tenant",
      bills_internet: details.billsIncluded ? "landlord" : "tenant",
      pets_allowed: details.petsAllowed,
      smoking_allowed: details.smokingAllowed,
      max_occupants: Number(details.maxOccupants) || Math.max(bedrooms * 2, 2),
      features,
      price_history: [],
      is_active: true,
      amenities: {
        ...details.amenities,
        has_parking_space: (features.parking ?? 0) + (features.garage ?? 0) > 0,
      },
      media: photos.map((p, i) => ({
        id: p.id,
        media_url: p.url,
        media_type: "image" as const,
        category: p.category,
        display_order: i,
      })),
      reviews: [],
      rating: 0,
      review_count: 0,
      created_at: new Date().toISOString(),
    };
  }, [details, features, photos, bedrooms, bathrooms, priceNum, role, session]);

  const publishButton = (
    <button
      type="button"
      onClick={publish}
      disabled={publishing}
      className="btn-gold inline-flex h-12 shrink-0 items-center gap-2 rounded-full px-5 text-sm font-semibold transition disabled:opacity-60 lg:px-6"
    >
      {publishing ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Publishing…
        </>
      ) : (
        <>
          Publish Listing
          <ArrowRight className="size-4" />
        </>
      )}
    </button>
  );

  if (publishedProperty) {
    return (
      <div className="px-4 py-8 lg:px-6">
        <div className="mx-auto w-full max-w-[24rem]">
          <div className="mb-4 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-verified text-white">
              <Check className="size-6" strokeWidth={3} />
            </span>
            <h1 className="mt-3 text-xl font-bold text-brand">
              Your listing is live
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              This is how renters see it in search results.
            </p>
          </div>
          <PropertyCard property={publishedProperty} />
          <div className="mt-5 flex flex-col gap-2">
            <Link
              href={`/properties/${publishedProperty.id}`}
              className="btn-gold inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold"
            >
              View listing
              <ArrowRight className="size-4" />
            </Link>
            <button
              type="button"
              onClick={onNewListing}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-white px-6 text-sm font-semibold text-brand transition hover:border-gold"
            >
              <FilePlus2 className="size-4" />
              Add another listing
            </button>
            <Link
              href="/mine"
              className="inline-flex h-10 items-center justify-center text-xs font-semibold text-muted-foreground hover:text-brand"
            >
              Go to My Listings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-3 pb-44 lg:px-6 lg:pt-4 lg:pb-6">
      {/* Top bar */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Link
          href="/mine"
          aria-label="Back to My Listings"
          className="inline-flex size-10 shrink-0 items-center justify-center gap-2 rounded-full border border-border bg-white text-xs font-semibold text-brand shadow-sm transition hover:border-gold sm:w-auto sm:px-4"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Back to My Listings</span>
        </Link>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <IconButton
            label="Undo last canvas change"
            onClick={undo}
            disabled={!canUndo || preview}
          >
            <Undo2 className="size-4" />
          </IconButton>
          <IconButton
            label="Redo canvas change"
            onClick={redo}
            disabled={!canRedo || preview}
          >
            <Redo2 className="size-4" />
          </IconButton>
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            aria-pressed={preview}
            aria-label={preview ? "Exit preview" : "Preview listing"}
            className={cn(
              "inline-flex size-10 shrink-0 items-center justify-center gap-2 rounded-full border text-xs font-semibold shadow-sm transition hover:border-gold sm:w-auto sm:px-4",
              preview
                ? "border-gold bg-accent text-brand"
                : "border-border bg-white text-brand",
            )}
          >
            {preview ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
            <span className="hidden sm:inline">
              {preview ? "Exit preview" : "Preview"}
            </span>
          </button>
          <button
            type="button"
            onClick={startNew}
            aria-label="Start a new listing"
            className="inline-flex size-10 shrink-0 items-center justify-center gap-2 rounded-full border border-border bg-white text-xs font-semibold text-brand shadow-sm transition hover:border-gold sm:w-auto sm:px-4"
          >
            <FilePlus2 className="size-4" />
            <span className="hidden sm:inline">New listing</span>
          </button>
          {hasContent && (
            <button
              type="button"
              onClick={discardDraft}
              aria-label="Delete this listing draft"
              className="inline-flex size-10 shrink-0 items-center justify-center gap-2 rounded-full border border-destructive/30 bg-white text-xs font-semibold text-destructive shadow-sm transition hover:bg-destructive hover:text-white sm:w-auto sm:px-4"
            >
              <Trash2 className="size-4" />
              <span className="hidden sm:inline">Delete listing</span>
            </button>
          )}
          <button
            type="button"
            onClick={saveNow}
            aria-label="Save draft"
            className="btn-gold inline-flex size-10 shrink-0 items-center justify-center gap-2 rounded-full text-xs font-semibold transition sm:w-auto sm:px-4"
          >
            <Save className="size-4" />
            <span className="hidden sm:inline">Save Listing</span>
          </button>
        </div>
      </div>

      <div
        className={cn(
          "mt-4 grid grid-cols-[minmax(0,1fr)] items-start gap-4",
          preview
            ? "mx-auto w-full max-w-[24rem]"
            : "lg:grid-cols-[16.5rem_minmax(0,1fr)_20rem] xl:grid-cols-[17.5rem_minmax(0,1fr)_21rem]",
        )}
      >
        {!preview && (
          <div className="order-2 min-w-0 lg:sticky lg:top-[5.5rem] lg:order-none">
            <FeaturePalette
              features={features}
              onAddFeature={addFeature}
              photoRoom={photoRoom}
              onPhotoRoom={setPhotoRoom}
              amenities={details.amenities}
              onAmenity={(key, value) =>
                patch({ amenities: { ...details.amenities, [key]: value } })
              }
              petsAllowed={details.petsAllowed}
              smokingAllowed={details.smokingAllowed}
              onRule={(key, value) => patch({ [key]: value })}
            />
          </div>
        )}

        {preview ? (
          <div className="space-y-4">
            <p className="text-center text-xs text-muted-foreground">
              Preview — this is exactly how your listing will look in search
              results.
            </p>
            <PropertyCard property={draftProperty} preview />
            <div className="flex justify-center max-lg:hidden">{publishButton}</div>
          </div>
        ) : (
          <div className="order-1 min-w-0 lg:order-none">
          <ListingCanvas
            preview={false}
            title={details.title}
            onTitle={(title) => patch({ title })}
            description={details.description}
            locationLabel={locationLabel || "Add a location"}
            stayDuration={details.stayDuration}
            verifiedLabel={verifiedLabel}
            features={features}
            photos={photos}
            pending={pending}
            onFiles={uploadFiles}
            onAddFeature={addFeature}
            onStepFeature={(key, delta) =>
              commit((c) => withFeatureStepped(c, key, delta))
            }
            onRemoveFeature={(key) => commit((c) => withFeatureRemoved(c, key))}
            onMakeCover={makeCover}
            onRemovePhoto={removePhoto}
            price={details.price}
            onPrice={(price) => patch({ price })}
            action={publishButton}
          />
          </div>
        )}

        {!preview && (
          <DetailsPanel
            details={details}
            onChange={patch}
            onRegion={changeRegion}
            gps={gps}
            onGps={setGps}
            onAutoDescription={writeDescription}
            featureUnits={featureUnits}
            photos={photos}
            checklist={checklist}
            className="order-3 min-w-0 lg:sticky lg:top-[5.5rem] lg:order-none lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto"
          />
        )}
      </div>

      {/* Phones: always-reachable publish bar, sitting above the bottom tab bar */}
      <div className="fixed inset-x-0 bottom-[calc(5.9rem+env(safe-area-inset-bottom))] z-40 border-t border-border bg-white/95 px-4 py-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-brand">
              {checklist.filter((c) => c.done).length}/{checklist.length} ready
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {firstMissing
                ? `Next: ${firstMissing.label}`
                : "All set — publish when you're ready"}
            </p>
          </div>
          {publishButton}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-border bg-white px-4 py-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2 font-medium text-foreground">
          <span className="flex size-5 items-center justify-center rounded-full bg-verified text-white">
            <Check className="size-3" strokeWidth={3} />
          </span>
          All changes saved {agoLabel(savedAt, now)}
        </span>
        <span aria-hidden className="hidden h-4 w-px bg-border sm:block" />
        <span>Auto-save enabled — your draft stays on this device</span>
      </div>
    </div>
  );
}

export function ListingStudio() {
  const router = useRouter();
  const { status } = useSession();
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      toast.message("Sign in as a landlord, agent, or firm to list a home");
      router.push("/login");
    }
  }, [status, router]);

  // The workspace reads the saved draft from localStorage, so it only mounts on the client
  // once the session has resolved — never during server rendering.
  if (status !== "authenticated") {
    return (
      <div className="px-4 py-16 text-center text-sm text-muted-foreground">
        Checking session…
      </div>
    );
  }
  return (
    <StudioWorkspace
      key={resetKey}
      onNewListing={() => setResetKey((k) => k + 1)}
    />
  );
}
