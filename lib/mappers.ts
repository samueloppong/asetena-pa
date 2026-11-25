import type {
  Property,
  PropertyAmenities as AmenitiesRow,
  PropertyMedia as MediaRow,
  Review as ReviewRow,
  User,
} from "@prisma/client";
import type { Property as AppProperty, User as AppUser } from "./types";
import { parseFeatures } from "./listing-features";
import { toPublicMediaUrl } from "./media-url";

type PropertyWithRelations = Property & {
  landlord: User;
  amenities: AmenitiesRow | null;
  media: MediaRow[];
  reviews: (ReviewRow & { reviewer?: Pick<User, "fullName"> | null })[];
  priceChanges?: { pricePerMonth: { toString(): string }; createdAt: Date }[];
  _count?: { reviews: number };
};

export function mapUser(user: User): AppUser {
  return {
    id: user.id,
    email: user.email,
    phone_number: user.phoneNumber,
    full_name: user.fullName,
    company_name: user.companyName ?? undefined,
    role: user.role,
    ghana_card_number: user.ghanaCardNumber ?? undefined,
    id_verification_status: user.idVerificationStatus,
    avatar_url: user.avatarUrl ?? undefined,
  };
}

export function mapProperty(property: PropertyWithRelations): AppProperty {
  const reviews = property.reviews ?? [];
  const rating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return {
    id: property.id,
    landlord: mapUser(property.landlord),
    title: property.title,
    description: property.description,
    property_type: property.propertyType,
    price_per_month: Number(property.pricePerMonth),
    advance_period: property.advancePeriod,
    security_deposit: Number(property.securityDeposit),
    region: property.region,
    city_town: property.cityTown,
    neighborhood: property.neighborhood,
    digital_address_ghanapost: property.digitalAddressGhanapost ?? undefined,
    latitude: property.latitude != null ? Number(property.latitude) : undefined,
    longitude:
      property.longitude != null ? Number(property.longitude) : undefined,
    location_verified: property.locationVerified,
    location_accuracy_meters: property.locationAccuracyMeters ?? undefined,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    square_footage: property.squareFootage ?? undefined,
    is_direct_owner_verified: property.isDirectOwnerVerified,
    listing_actor_type: property.listingActorType,
    ownership_status: property.ownershipStatus,
    availability: property.availability,
    stay_duration: property.stayDuration,
    furnishing: property.furnishing,
    available_from: property.availableFrom
      ? property.availableFrom.toISOString().slice(0, 10)
      : undefined,
    bills_electricity: property.billsElectricity,
    bills_water: property.billsWater,
    bills_internet: property.billsInternet,
    pets_allowed: property.petsAllowed,
    smoking_allowed: property.smokingAllowed,
    max_occupants: property.maxOccupants ?? undefined,
    quiet_hours: property.quietHours ?? undefined,
    house_rules: property.houseRules ?? undefined,
    features: parseFeatures(property.features),
    price_history: (property.priceChanges ?? [])
      .slice()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((point) => ({
        price_per_month: Number(point.pricePerMonth),
        recorded_at: point.createdAt.toISOString(),
      })),
    is_active: property.isActive,
    amenities: property.amenities
      ? {
          has_polytank_water: property.amenities.hasPolytankWater,
          has_standby_generator: property.amenities.hasStandbyGenerator,
          has_solar: property.amenities.hasSolar,
          has_air_conditioning: property.amenities.hasAirConditioning,
          is_walled_and_gated: property.amenities.isWalledAndGated,
          has_self_meter: property.amenities.hasSelfMeter,
          has_parking_space: property.amenities.hasParkingSpace,
        }
      : {
          has_polytank_water: false,
          has_standby_generator: false,
          has_solar: false,
          has_air_conditioning: false,
          is_walled_and_gated: false,
          has_self_meter: true,
          has_parking_space: false,
        },
    media: property.media
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((m) => ({
        id: m.id,
        media_url: toPublicMediaUrl(m.mediaUrl),
        media_type: m.mediaType as "image" | "video",
        category: m.category,
        display_order: m.displayOrder,
      })),
    reviews: reviews.map((r) => ({
      id: r.id,
      reviewer_name: r.reviewer?.fullName ?? "Renter",
      rating: r.rating,
      comment: r.comment ?? "",
      created_at: r.createdAt.toISOString(),
    })),
    rating: reviews.length > 0 ? Math.round(rating * 10) / 10 : 0,
    review_count: property._count?.reviews ?? reviews.length,
    created_at: property.createdAt.toISOString(),
  };
}
