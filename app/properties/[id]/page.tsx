import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  CigaretteOff,
  MapPin,
  Ruler,
  ShieldCheck,
  Sofa,
  Star,
  Users,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { renterHasCompletedStay } from "@/lib/rentals";
import { RoomViewTabs } from "@/components/property/RoomViewTabs";
import { AmenitiesGrid } from "@/components/property/AmenitiesGrid";
import { RentalActions } from "@/components/property/RentalActions";
import { ListingMap } from "@/components/property/ListingMap";
import { ShareListingButton } from "@/components/property/ShareListingButton";
import { StayReviewForm } from "@/components/property/StayReviewForm";
import { FavoriteButton } from "@/components/property/FavoriteButton";
import { MoveInCostCalculator } from "@/components/property/MoveInCostCalculator";
import { FurnishingPartners } from "@/components/property/FurnishingPartners";
import { NeighborhoodInsights } from "@/components/property/NeighborhoodInsights";
import { ReportListingButton } from "@/components/property/ReportListingButton";
import { PeopleWatching } from "@/components/property/PeopleWatching";
import { TrustBadge } from "@/components/trust/TrustBadge";
import { getPropertyFromDb } from "@/lib/properties";
import { FEATURES, featureCountLabel } from "@/lib/listing-features";
import { getTrustScore } from "@/lib/trust";
import { landlordReplyLabel } from "@/lib/reply-time";
import { isJustAdded } from "@/lib/just-added";
import {
  ADVANCE_LABELS,
  FURNISHING_LABELS,
  formatGhs,
  formatLocation,
  maxPersonsLabel,
  PROPERTY_TYPE_LABELS,
  smokingRuleLabel,
} from "@/lib/format";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const property = await getPropertyFromDb(id);
  if (!property) notFound();
  // Components added in the Listing Studio (bedrooms/bathrooms already have their own tiles).
  const extraFeatures = FEATURES.flatMap((def) => {
    const count = property.features?.[def.key] ?? 0;
    if (count <= 0 || def.key === "bedroom" || def.key === "bathroom") return [];
    return [{ key: def.key, label: featureCountLabel(def.key, count), Icon: def.icon }];
  });
  const landlordTrust = await getTrustScore(property.landlord.id);
  const replyLabel = await landlordReplyLabel(property.landlord.id);
  const session = await auth();
  let canReviewStay = false;
  if (session?.user?.id) {
    const stayed = await renterHasCompletedStay(property.id, session.user.id);
    if (stayed) {
      const existing = await prisma.review.findUnique({
        where: {
          propertyId_reviewerId: {
            propertyId: property.id,
            reviewerId: session.user.id,
          },
        },
        select: { id: true },
      });
      canReviewStay = !existing;
    }
  }

  return (
    <main className="pb-44 lg:pb-28">
      <div className="sticky top-0 z-30 flex items-center justify-between bg-white/90 px-4 py-3 backdrop-blur-xl sm:static sm:bg-transparent sm:px-4 sm:pt-4">
        <Link
          href="/"
          className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-sm"
          aria-label="Back to explore"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex items-center gap-2">
          <ShareListingButton title={property.title} />
          <FavoriteButton propertyId={property.id} />
        </div>
      </div>

      <div className="sm:px-4">
        <RoomViewTabs media={property.media} title={property.title} />
      </div>

      <div className="space-y-6 px-4 pt-5">
        <div className="space-y-2">
          <p className="text-3xl font-extrabold tracking-tight text-brand">
            {formatGhs(property.price_per_month)}
            <span className="text-base font-medium text-muted-foreground"> pcm</span>
          </p>
          <PeopleWatching propertyId={property.id} className="mt-1" />
          <p className="text-sm text-muted-foreground">
            {ADVANCE_LABELS[property.advance_period]}
            {property.price_history.length > 1
              ? ` · was ${formatGhs(property.price_history[property.price_history.length - 2].price_per_month)}`
              : ""}
          </p>
          {property.latitude != null && property.longitude != null ? (
            <div className="space-y-1">
              <a href="#where" className="flex items-center gap-1.5 text-sm font-medium text-foreground underline-offset-2 hover:underline">
                <MapPin className="size-4 shrink-0 text-primary" />
                {formatLocation(property.neighborhood, property.city_town)}
                {property.region ? `, ${property.region}` : ""}
                {property.digital_address_ghanapost ? ` · ${property.digital_address_ghanapost}` : ""}
              </a>
              <p className="pl-5 font-mono text-xs text-muted-foreground">
                GPS {property.latitude.toFixed(6)}, {property.longitude.toFixed(6)}
                {" · "}
                <a href="#where" className="font-sans font-medium text-primary underline-offset-2 hover:underline">
                  Check on map
                </a>
              </p>
            </div>
          ) : (
            <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <MapPin className="size-4 shrink-0 text-primary" />
              {formatLocation(property.neighborhood, property.city_town)}
              {property.region ? `, ${property.region}` : ""}
              {property.digital_address_ghanapost ? ` · ${property.digital_address_ghanapost}` : ""}
            </p>
          )}
          <p className="text-xs font-semibold tracking-wide text-primary uppercase">
            {PROPERTY_TYPE_LABELS[property.property_type]}
            {isJustAdded(property.created_at) ? " · Just added" : ""}
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-brand">
            {property.title}
          </h1>
          {property.availability !== "available" && (
            <p className="rounded-xl bg-secondary px-3 py-2 text-sm font-medium text-foreground">
              {property.availability === "rented"
                ? "This home has been rented. The listing is no longer live."
                : property.availability === "held"
                  ? "This home is held for an applicant."
                  : "The landlord has paused this listing."}
            </p>
          )}
          {property.location_verified && property.latitude != null && property.longitude != null && (
            <p className="inline-flex items-center gap-1 text-xs font-medium text-verified">
              <ShieldCheck className="size-3.5" />
              GPS verified on-site
            </p>
          )}
          <p className="inline-flex items-center gap-1 text-sm font-medium">
            <Star className="size-4 fill-rating text-rating" />
            {property.review_count > 0 ? (
              <>
                {property.rating.toFixed(1)}
                <span className="font-normal text-muted-foreground">
                  ({property.review_count} stay reviews)
                </span>
              </>
            ) : (
              <span className="font-normal text-muted-foreground">No stay reviews yet</span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <Spec icon={<BedDouble className="size-4" />} label={`${property.bedrooms} Beds`} />
          <Spec icon={<Bath className="size-4" />} label={`${property.bathrooms} Baths`} />
          <Spec
            icon={<Users className="size-4" />}
            label={maxPersonsLabel(property.max_occupants, property.bedrooms)}
          />
          <Spec
            icon={<Sofa className="size-4" />}
            label={
              property.stay_duration === "short_stay" && property.furnishing === "furnished"
                ? "Fully furnished"
                : FURNISHING_LABELS[property.furnishing]
            }
          />
          <Spec
            icon={<CigaretteOff className="size-4" />}
            label={smokingRuleLabel(property.smoking_allowed)}
          />
          <Spec
            icon={<Ruler className="size-4" />}
            label={
              property.square_footage
                ? `${property.square_footage.toLocaleString()} sq ft`
                : PROPERTY_TYPE_LABELS[property.property_type]
            }
          />
        </div>

        {extraFeatures.length > 0 && (
          <ul aria-label="Home features" className="flex flex-wrap gap-2">
            {extraFeatures.map(({ key, label, Icon }) => (
              <li
                key={key}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground"
              >
                <Icon className="size-3.5 text-brand" strokeWidth={1.7} />
                {label}
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4">
          {property.landlord.avatar_url ? (
            <Image
              src={property.landlord.avatar_url}
              alt={property.landlord.full_name}
              width={48}
              height={48}
              className="size-12 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-sm font-bold">
              {property.landlord.full_name.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">
              {property.listing_actor_type === "firm"
                ? property.landlord.company_name || "Firm"
                : property.listing_actor_type === "agent"
                  ? `Agent: ${property.landlord.full_name}`
                  : `Landlord: ${property.landlord.full_name}`}
            </p>
            {property.listing_actor_type === "firm" ? (
              <p className="text-sm text-foreground">
                Authorised contact: {property.landlord.full_name}
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              {property.listing_actor_type === "firm"
                ? property.landlord.id_verification_status === "verified"
                  ? "ID verified firm contact"
                  : "Firm verification pending"
                : property.listing_actor_type === "agent"
                  ? property.landlord.id_verification_status === "verified"
                    ? "ID verified letting agent"
                    : "Agent verification pending"
                  : property.landlord.id_verification_status === "verified"
                    ? "ID verified landlord"
                    : "Verification pending"}
              {replyLabel ? ` · ${replyLabel}` : ""}
            </p>
            {landlordTrust ? (
              <div className="mt-1.5">
                <TrustBadge
                  score={landlordTrust.score}
                  label={landlordTrust.label}
                />
              </div>
            ) : null}
          </div>
          {property.listing_actor_type === "agent" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-verified">
              <ShieldCheck className="size-3.5" />
              Verified agent
            </span>
          ) : property.listing_actor_type === "firm" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-verified">
              <ShieldCheck className="size-3.5" />
              Verified firm
            </span>
          ) : property.is_direct_owner_verified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-verified">
              <ShieldCheck className="size-3.5" />
              Verified owner
            </span>
          ) : null}
        </div>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-brand">Key Features</h2>
          <AmenitiesGrid amenities={property.amenities} />
        </section>

        <section className="space-y-3">
          <div
            className="border border-gold/20 bg-[#fffff7] px-4 py-4 [border-radius:unset]"
            style={{ borderRadius: "unset" }}
          >
            <h2 className="text-[10px] font-bold tracking-[0.14em] text-gold-ink uppercase">
              Description
            </h2>
            <p className="mt-2 text-sm leading-[1.6] text-[#3a3428]">
              {property.description}
            </p>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-brand">House rules and bills</h2>
          <p className="text-sm text-muted-foreground">
            {FURNISHING_LABELS[property.furnishing]}
            {property.stay_duration === "short_stay" ? " · short stay" : " · long stay"}
            {property.available_from ? ` · free from ${property.available_from}` : " · available now"}
            {" · "}
            {maxPersonsLabel(property.max_occupants, property.bedrooms)}
          </p>
          <p className="text-sm text-muted-foreground">
            ECG {property.bills_electricity} · water {property.bills_water} · internet {property.bills_internet}
          </p>
          <p className="text-sm font-medium text-foreground">
            {smokingRuleLabel(property.smoking_allowed)}
            <span className="font-normal text-muted-foreground">
              {" · "}
              Pets {property.pets_allowed ? "allowed" : "not allowed"}
              {property.quiet_hours ? ` · quiet hours ${property.quiet_hours}` : ""}
            </span>
          </p>
          {property.security_deposit > 0 ? (
            <p className="text-sm text-muted-foreground">
              Security deposit {formatGhs(property.security_deposit)} is held and can be charged when you leave or your stay ends if there is damage or unpaid bills.
            </p>
          ) : null}
          {property.house_rules ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {property.house_rules}
            </p>
          ) : null}
        </section>

        <FurnishingPartners
          furnishing={property.furnishing}
          region={property.region}
          cityTown={property.city_town}
          neighborhood={property.neighborhood}
        />

        <MoveInCostCalculator
          pricePerMonth={property.price_per_month}
          advancePeriod={property.advance_period}
          securityDeposit={property.security_deposit}
        />

        {property.latitude != null && property.longitude != null && (
          <ListingMap
            latitude={property.latitude}
            longitude={property.longitude}
            label={property.title}
            verified={Boolean(property.location_verified)}
          />
        )}

        <NeighborhoodInsights
          neighborhood={property.neighborhood}
          cityTown={property.city_town}
        />

        <section className="space-y-3">
          <h2 className="text-base font-bold text-brand">Stay reviews</h2>
          {property.reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Reviews appear after a renter moves in through Ashesi Pa.
            </p>
          ) : (
            <ul className="space-y-3">
              {property.reviews.map((review) => (
                <li key={review.id} className="rounded-2xl border border-border bg-white p-4">
                  <p className="text-sm font-semibold">
                    {review.reviewer_name} · {review.rating}/5
                  </p>
                  {review.comment ? (
                    <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {canReviewStay ? <StayReviewForm propertyId={property.id} /> : null}
        </section>

        <ReportListingButton propertyId={property.id} />
      </div>

      <RentalActions
        propertyId={property.id}
        landlordId={property.landlord.id}
        pricePerMonth={property.price_per_month}
        advancePeriod={property.advance_period}
        availability={property.availability}
      />
    </main>
  );
}

function Spec({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-white px-2 py-3 text-center">
      <span className="text-primary">{icon}</span>
      <span className="text-xs font-medium text-foreground">{label}</span>
    </div>
  );
}
