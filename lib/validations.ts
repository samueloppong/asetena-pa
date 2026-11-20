import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  phoneNumber: z
    .string()
    .min(9)
    .max(20)
    .regex(/^\+?[0-9]+$/, "Use a valid phone number"),
  fullName: z.string().min(2).max(100),
  password: z.string().min(8).max(100),
  role: z.enum(["renter", "landlord"]).default("renter"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const propertyCreateSchema = z.object({
  title: z.string().min(3).max(150),
  description: z.string().min(10),
  propertyType: z.enum([
    "apartment",
    "house",
    "chamber_and_hall",
    "single_room",
    "short_stay",
  ]),
  pricePerMonth: z.coerce.number().positive(),
  advancePeriod: z.enum(["monthly", "six_months", "one_year", "two_years"]),
  securityDeposit: z.coerce.number().min(0).default(0),
  region: z.string().min(2).max(50),
  cityTown: z.string().min(2).max(50),
  neighborhood: z.string().min(2).max(50),
  digitalAddressGhanapost: z.string().max(15).optional().nullable(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  locationAccuracyMeters: z.coerce.number().positive().optional().nullable(),
  bedrooms: z.coerce.number().int().min(0),
  bathrooms: z.coerce.number().int().min(0),
  squareFootage: z.coerce.number().int().positive().optional().nullable(),
    amenities: z
    .object({
      hasPolytankWater: z.boolean().default(false),
      hasStandbyGenerator: z.boolean().default(false),
      hasAirConditioning: z.boolean().default(false),
      isWalledAndGated: z.boolean().default(false),
      hasSelfMeter: z.boolean().default(true),
      hasParkingSpace: z.boolean().default(false),
    })
    .default({
      hasPolytankWater: false,
      hasStandbyGenerator: false,
      hasAirConditioning: false,
      isWalledAndGated: false,
      hasSelfMeter: true,
      hasParkingSpace: false,
    }),
  furnishing: z.enum(["unfurnished", "semi_furnished", "furnished"]).default("unfurnished"),
  availableFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  billsElectricity: z.enum(["tenant", "landlord", "shared"]).default("tenant"),
  billsWater: z.enum(["tenant", "landlord", "shared"]).default("tenant"),
  billsInternet: z.enum(["tenant", "landlord", "shared"]).default("tenant"),
  petsAllowed: z.boolean().default(false),
  smokingAllowed: z.boolean().default(false),
  maxOccupants: z.coerce.number().int().positive().optional().nullable(),
  quietHours: z.string().max(80).optional().nullable(),
  houseRules: z.string().max(1000).optional().nullable(),
  accessInstructions: z.string().max(1000).optional().nullable(),
  media: z
    .array(
      z.object({
        mediaUrl: z.string().min(1),
        mediaType: z.enum(["image", "video"]).default("image"),
        category: z.enum([
          "living_room",
          "bedroom",
          "kitchen",
          "bathroom",
          "balcony",
          "exterior",
          "street_view",
        ]),
        displayOrder: z.number().int().min(0).default(0),
      })
    )
    .min(1),
});

export const chatThreadCreateSchema = z.object({
  propertyId: z.string().uuid(),
  message: z.string().min(1).max(2000).optional(),
});

export const chatMessageCreateSchema = z.object({
  body: z.string().min(1).max(2000),
});

export const listingReportSchema = z.object({
  reason: z.enum([
    "not_owner",
    "stolen_photos",
    "price_too_good",
    "already_rented",
    "wrong_location",
    "requested_upfront_payment",
    "other",
  ]),
  details: z.string().max(1000).optional(),
});

export const neighborhoodInsightSchema = z.object({
  neighborhood: z.string().min(2).max(50),
  cityTown: z.string().min(2).max(50),
  powerRating: z.coerce.number().int().min(1).max(5),
  waterRating: z.coerce.number().int().min(1).max(5),
  safetyRating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});
const yymmdd = z.string().regex(/^[0-9]{6}$/);

export const ghanaCardVerificationPayloadSchema = z.object({
  sessionId: z.string().uuid(),
  timestamp: z.string().datetime({ offset: true }).or(z.string().datetime()),
  mrzData: z.object({
    documentNumber: z.string().regex(/^[A-Z0-9]{9}$/),
    dateOfBirth: yymmdd,
    dateOfExpiry: yymmdd,
    mrzRaw: z.string().min(10),
  }),
  nfcChipData: z.object({
    dg1PersonalDetails: z.object({
      nationalIdNumber: z
        .string()
        .min(5)
        .max(30)
        .refine(
          (v) =>
            /^GHA-[0-9]{9}-[0-9]$/.test(v) || /^[A-Z0-9]{6,20}$/.test(v),
          "Invalid national ID from chip"
        ),
      surname: z.string().min(1),
      givenNames: z.string().min(1),
      gender: z.enum(["M", "F", "X"]),
      nationality: z.string().default("GHA"),
    }),
    dg2FacePhotoBase64: z.string().min(1),
    passiveAuthentication: z.object({
      isValid: z.boolean(),
      documentSignerCertBase64: z.string().min(1),
      signatureAlgorithm: z.string().min(1),
    }),
    activeAuthentication: z.object({
      isSupported: z.boolean(),
      isAuthentic: z.boolean(),
    }),
  }),
  biometrics: z.object({
    liveSelfieBase64: z.string().min(1),
    livenessPassed: z.boolean(),
    faceMatchScore: z.number().min(0).max(1),
  }),
  verificationStatus: z.object({
    overallResult: z.enum(["PASSED", "FLAGGED_FOR_REVIEW", "REJECTED"]),
    checks: z.object({
      mrzMatch: z.boolean(),
      chipAuthentic: z.boolean(),
      faceMatch: z.boolean(),
      niaLookupMatch: z.boolean(),
    }),
  }),
  chipProvenance: z.object({
    method: z.literal("nfc"),
    library: z.string().min(1),
    platform: z.enum(["android", "ios"]),
  }),
});

export type GhanaCardVerificationPayload = z.infer<
  typeof ghanaCardVerificationPayloadSchema
>;

export const verificationSubmitSchema = z.object({
  documentType: z.enum(["ghana_card", "passport", "drivers_license"]),
  idNumber: z.string().min(4).max(30),
  idPhotoUrl: z.string().min(1),
  selfieUrl: z.string().min(1),
});

export const verificationReviewSchema = z.object({
  decision: z.enum(["verified", "rejected"]),
  reviewerNotes: z.string().max(500).optional(),
});

export const propertyUpdateSchema = z
  .object({
    title: z.string().min(3).max(150).optional(),
    description: z.string().min(10).optional(),
    pricePerMonth: z.coerce.number().positive().optional(),
    advancePeriod: z.enum(["monthly", "six_months", "one_year", "two_years"]).optional(),
    securityDeposit: z.coerce.number().min(0).optional(),
    digitalAddressGhanapost: z.string().max(15).optional().nullable(),
    bedrooms: z.coerce.number().int().min(0).optional(),
    bathrooms: z.coerce.number().int().min(0).optional(),
    availability: z.enum(["available", "paused", "held", "rented"]).optional(),
    furnishing: z.enum(["unfurnished", "semi_furnished", "furnished"]).optional(),
    availableFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    billsElectricity: z.enum(["tenant", "landlord", "shared"]).optional(),
    billsWater: z.enum(["tenant", "landlord", "shared"]).optional(),
    billsInternet: z.enum(["tenant", "landlord", "shared"]).optional(),
    petsAllowed: z.boolean().optional(),
    smokingAllowed: z.boolean().optional(),
    maxOccupants: z.coerce.number().int().positive().optional().nullable(),
    quietHours: z.string().max(80).optional().nullable(),
    houseRules: z.string().max(1000).optional().nullable(),
    accessInstructions: z.string().max(1000).optional().nullable(),
    amenities: z
      .object({
        hasPolytankWater: z.boolean(),
        hasStandbyGenerator: z.boolean(),
        hasAirConditioning: z.boolean(),
        isWalledAndGated: z.boolean(),
        hasSelfMeter: z.boolean(),
        hasParkingSpace: z.boolean(),
      })
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "Nothing to update");

export const rentalRequestCreateSchema = z.object({
  kind: z.enum(["tour", "application"]),
  message: z.string().max(1000).optional(),
  viewingAt: z.string().min(1).optional(),
  moveInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  offeredAdvance: z.enum(["monthly", "six_months", "one_year", "two_years"]).optional(),
  monthlyIncome: z.coerce.number().positive().optional(),
  employmentStatus: z.enum(["employed", "self_employed", "student", "other"]).optional(),
  previousLandlordName: z.string().max(100).optional(),
  previousLandlordPhone: z.string().max(20).optional(),
  previousLandlordNote: z.string().max(500).optional(),
});

export const rentalRequestActionSchema = z.object({
  action: z.enum(["accept", "decline", "cancel", "confirm_receipt", "complete"]),
  landlordNote: z.string().max(500).optional(),
});

export const stayReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const ownershipClaimSchema = z.object({
  landTitleDocumentUrl: z.string().min(1),
});

export const ownershipDecisionSchema = z.object({
  decision: z.enum(["verified", "rejected"]),
});

export const reportModerationSchema = z.object({
  action: z.enum(["reviewing", "resolved", "dismissed", "restore_listing"]),
});

export const handoverSchema = z.object({
  conditionNote: z.string().max(1000).optional(),
  deductions: z.coerce.number().min(0).optional(),
  returnedAmount: z.coerce.number().min(0).optional(),
  confirm: z.boolean().optional(),
});

export const agreementSignSchema = z.object({
  signedName: z.string().trim().min(2).max(100),
});

export const ledgerStatusSchema = z.object({
  entryId: z.string().uuid(),
  status: z.enum(["expected", "received", "late"]),
});

export const userReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});
