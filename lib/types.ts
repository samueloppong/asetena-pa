export type UserRole = "renter" | "landlord" | "agent" | "firm" | "admin";

export type ListingActorType = "owner" | "agent" | "firm";
export type VerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "rejected";

export type PropertyType =
  | "apartment"
  | "house"
  | "chamber_and_hall"
  | "single_room"
  | "short_stay";

export type PaymentFrequency =
  | "monthly"
  | "six_months"
  | "one_year"
  | "two_years";

export type RoomCategory =
  | "living_room"
  | "bedroom"
  | "kitchen"
  | "bathroom"
  | "balcony"
  | "exterior"
  | "street_view";

export interface User {
  id: string;
  email: string;
  phone_number: string;
  full_name: string;
  company_name?: string;
  role: UserRole;
  ghana_card_number?: string;
  id_verification_status: VerificationStatus;
  avatar_url?: string;
}

export interface PropertyAmenities {
  has_polytank_water: boolean;
  has_standby_generator: boolean;
  has_solar: boolean;
  has_air_conditioning: boolean;
  is_walled_and_gated: boolean;
  has_self_meter: boolean;
  has_parking_space: boolean;
}

export interface PropertyMedia {
  id: string;
  media_url: string;
  media_type: "image" | "video";
  category: RoomCategory;
  display_order: number;
}

export interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Property {
  id: string;
  landlord: User;
  title: string;
  description: string;
  property_type: PropertyType;
  price_per_month: number;
  advance_period: PaymentFrequency;
  security_deposit: number;
  region: string;
  city_town: string;
  neighborhood: string;
  digital_address_ghanapost?: string;
  latitude?: number;
  longitude?: number;
  location_verified?: boolean;
  location_accuracy_meters?: number;
  bedrooms: number;
  bathrooms: number;
  square_footage?: number;
  is_direct_owner_verified: boolean;
  listing_actor_type: ListingActorType;
  ownership_status: OwnershipReviewStatus;
  availability: ListingAvailability;
  stay_duration: StayDuration;
  furnishing: Furnishing;
  available_from?: string;
  bills_electricity: BillPayer;
  bills_water: BillPayer;
  bills_internet: BillPayer;
  pets_allowed: boolean;
  smoking_allowed: boolean;
  max_occupants?: number;
  quiet_hours?: string;
  house_rules?: string;
  features?: Record<string, number>;
  price_history: PricePoint[];
  is_active: boolean;
  amenities: PropertyAmenities;
  media: PropertyMedia[];
  reviews: Review[];
  rating: number;
  review_count: number;
  created_at: string;
}

export type ListingAvailability = "available" | "paused" | "held" | "rented";

export type Furnishing = "unfurnished" | "semi_furnished" | "furnished";

export type StayDuration = "long_stay" | "short_stay";

export type BillPayer = "tenant" | "landlord" | "shared";

export type EmploymentStatus = "employed" | "self_employed" | "student" | "other";

export interface PricePoint {
  price_per_month: number;
  recorded_at: string;
}

export interface RentLedgerEntryDto {
  id: string;
  label: string;
  amount: number;
  due_date: string;
  status: "expected" | "received" | "late";
}

export interface DepositHandoverDto {
  condition_note: string | null;
  deductions: number;
  returned_amount: number | null;
  landlord_confirmed: boolean;
  renter_confirmed: boolean;
}

export interface TenancyAgreementDto {
  body: string;
  landlord_signed_name: string;
  landlord_signed_at: string;
  renter_signed_name: string | null;
  renter_signed_at: string | null;
}

export type OwnershipReviewStatus = "none" | "pending" | "verified" | "rejected";

export type RentalRequestKind = "tour" | "application";

export type RentalRequestStatus =
  | "requested"
  | "accepted"
  | "declined"
  | "cancelled"
  | "completed";

export type AdvanceReceiptStatus = "not_recorded" | "landlord_confirmed";

export interface RentalRequestDto {
  id: string;
  property_id: string;
  property_title: string;
  kind: RentalRequestKind;
  status: RentalRequestStatus;
  message: string | null;
  viewing_at: string | null;
  move_in_date: string | null;
  offered_advance: PaymentFrequency | null;
  advance_receipt: AdvanceReceiptStatus;
  landlord_note: string | null;
  monthly_income: number | null;
  employment_status: string | null;
  previous_landlord_name: string | null;
  previous_landlord_phone: string | null;
  previous_landlord_note: string | null;
  agreed_price: number | null;
  agreed_deposit: number | null;
  agreed_advance: PaymentFrequency | null;
  agreed_move_in: string | null;
  agreed_rules: string | null;
  hold_until: string | null;
  access_instructions: string | null;
  ledger: RentLedgerEntryDto[];
  handover: DepositHandoverDto | null;
  agreement: TenancyAgreementDto | null;
  renter_id: string;
  renter_name: string;
  landlord_name: string;
  landlord_id: string;
  created_at: string;
  is_landlord: boolean;
}

export interface ManagedProperty {
  id: string;
  title: string;
  neighborhood: string;
  city_town: string;
  price_per_month: number;
  availability: ListingAvailability;
  is_active: boolean;
  is_direct_owner_verified: boolean;
  listing_actor_type: ListingActorType;
  ownership_status: OwnershipReviewStatus;
  land_title_document_url?: string;
  security_deposit: number;
  advance_period: PaymentFrequency;
  digital_address_ghanapost?: string;
  bedrooms: number;
  bathrooms: number;
  description: string;
  stay_duration: StayDuration;
  furnishing: Furnishing;
  available_from?: string;
  bills_electricity: BillPayer;
  bills_water: BillPayer;
  bills_internet: BillPayer;
  pets_allowed: boolean;
  smoking_allowed: boolean;
  max_occupants?: number;
  quiet_hours?: string;
  house_rules?: string;
  access_instructions?: string;
}

export interface AdminListingReport {
  id: string;
  property_id: string;
  property_title: string;
  property_active: boolean;
  reporter_name: string;
  reason: ReportReason;
  details?: string;
  status: ReportStatus;
  created_at: string;
}

export interface AdminOwnershipClaim {
  property_id: string;
  title: string;
  landlord_name: string;
  landlord_email: string;
  document_url: string;
  ownership_status: OwnershipReviewStatus;
}

export type ReportReason =
  | "not_owner"
  | "stolen_photos"
  | "price_too_good"
  | "already_rented"
  | "wrong_location"
  | "requested_upfront_payment"
  | "other";

export type ReportStatus = "pending" | "reviewing" | "resolved" | "dismissed";

export type VerificationDocumentType =
  | "ghana_card"
  | "passport"
  | "drivers_license";

export interface VerificationRequestSummary {
  id: string;
  document_type: VerificationDocumentType;
  status: VerificationStatus;
  reviewer_notes?: string;
  created_at: string;
  reviewed_at?: string;
}

export interface MyVerificationStatus {
  status: VerificationStatus;
  latest_request: VerificationRequestSummary | null;
}

export interface AdminVerificationRequest extends VerificationRequestSummary {
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: UserRole;
  /** Admin-only. Never part of public listing payloads. */
  user_company_name?: string;
  user_registration_number?: string;
  id_number: string;
  id_photo_url: string;
  selfie_url: string;
}

export interface ChatThreadSummary {
  id: string;
  property_id: string;
  property_title: string;
  property_image?: string;
  other_user_id: string;
  other_user_name: string;
  other_user_verified: boolean;
  other_trust_score: number;
  other_trust_label: TrustLabel;
  is_landlord_view: boolean;
  last_message: string | null;
  last_message_at: string;
  unread_count: number;
}

export interface ChatThreadHeader {
  id: string;
  property_id: string;
  property_title: string;
  other_user_name: string;
  other_user_verified: boolean;
  other_trust_score: number;
  other_trust_label: TrustLabel;
  can_review: boolean;
  already_reviewed: boolean;
}

export type TrustLabel =
  | "highly_trusted"
  | "trusted"
  | "building_trust"
  | "new_member";

export interface TrustScoreBreakdown {
  identity_points: number;
  tenure_points: number;
  review_points: number;
  baseline_points: number;
}

export interface TrustScoreSummary {
  user_id: string;
  score: number;
  label: TrustLabel;
  is_id_verified: boolean;
  member_since: string;
  review_count: number;
  average_rating: number | null;
  breakdown: TrustScoreBreakdown;
  recent_reviews: {
    id: string;
    rating: number;
    comment: string | null;
    reviewer_role: UserRole;
    created_at: string;
  }[];
}

export interface ChatMessageDto {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at?: string;
  mine: boolean;
}

export interface NeighborhoodInsightSummary {
  neighborhood: string;
  city_town: string;
  sample_size: number;
  avg_power_rating: number;
  avg_water_rating: number;
  avg_safety_rating: number;
  recent_comments: {
    id: string;
    comment: string;
    created_at: string;
    power_rating: number;
    water_rating: number;
    safety_rating: number;
  }[];
}

export type FilterChip =
  | "all"
  | "apartment"
  | "house"
  | "chamber_and_hall"
  | "short_stay"
  | "verified";
