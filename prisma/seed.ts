import bcrypt from "bcryptjs";
import { PrismaClient, type RoomCategory } from "@prisma/client";

const prisma = new PrismaClient();

type SeedListing = {
  title: string;
  description: string;
  propertyType:
    | "apartment"
    | "house"
    | "chamber_and_hall"
    | "single_room"
    | "short_stay";
  pricePerMonth: number;
  advancePeriod: "monthly" | "six_months" | "one_year" | "two_years";
  region: string;
  cityTown: string;
  neighborhood: string;
  digitalAddressGhanapost?: string;
  latitude: number;
  longitude: number;
  bedrooms: number;
  bathrooms: number;
  squareFootage?: number;
  maxOccupants: number;
  stayDuration?: "long_stay" | "short_stay";
  furnishing: "unfurnished" | "semi_furnished" | "furnished";
  smokingAllowed: boolean;
  isDirectOwnerVerified: boolean;
  /** owner = landlord; agent = letting agent; firm = estate firm / building society */
  listingActorType?: "owner" | "agent" | "firm";
  amenities: {
    hasPolytankWater: boolean;
    hasStandbyGenerator: boolean;
    hasSolar?: boolean;
    hasAirConditioning: boolean;
    isWalledAndGated: boolean;
    hasSelfMeter: boolean;
    hasParkingSpace: boolean;
  };
  media: { url: string; category: RoomCategory }[];
};

const listings: SeedListing[] = [
  {
    title: "Modern 4-Bedroom House in Cantonments",
    description:
      "No middleman agent required. Walk directly into a move-in ready executive house with air conditioning, fitted kitchen, standby generator, and a private compound.",
    propertyType: "house",
    pricePerMonth: 5500,
    advancePeriod: "one_year",
    region: "Greater Accra",
    cityTown: "Accra",
    neighborhood: "Cantonments",
    latitude: 5.5716,
    longitude: -0.167,
    digitalAddressGhanapost: "GA-183-9020",
    bedrooms: 4,
    bathrooms: 3,
    squareFootage: 2800,
    maxOccupants: 8,
    furnishing: "semi_furnished",
    smokingAllowed: false,
    isDirectOwnerVerified: true,
    amenities: {
      hasPolytankWater: true,
      hasStandbyGenerator: true,
      hasSolar: true,
      hasAirConditioning: true,
      isWalledAndGated: true,
      hasSelfMeter: true,
      hasParkingSpace: true,
    },
    media: [
      {
        url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop",
        category: "exterior",
      },
      {
        url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&h=800&fit=crop",
        category: "living_room",
      },
      {
        url: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200&h=800&fit=crop",
        category: "bedroom",
      },
      {
        url: "https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=1200&h=800&fit=crop",
        category: "kitchen",
      },
    ],
  },
  {
    title: "Executive 2-Bedroom Apartment",
    description:
      "Bright executive apartment in East Legon with fitted kitchen, reliable water (polytank), and parking for one car. Direct from owner — no inspection fees.",
    propertyType: "apartment",
    pricePerMonth: 3500,
    advancePeriod: "six_months",
    region: "Greater Accra",
    cityTown: "Accra",
    neighborhood: "East Legon",
    latitude: 5.635,
    longitude: -0.155,
    digitalAddressGhanapost: "GA-292-4410",
    bedrooms: 2,
    bathrooms: 2,
    squareFootage: 1200,
    maxOccupants: 4,
    furnishing: "furnished",
    smokingAllowed: false,
    isDirectOwnerVerified: true,
    amenities: {
      hasPolytankWater: true,
      hasStandbyGenerator: false,
      hasAirConditioning: true,
      isWalledAndGated: true,
      hasSelfMeter: true,
      hasParkingSpace: true,
    },
    media: [
      {
        url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop",
        category: "living_room",
      },
      {
        url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop",
        category: "bedroom",
      },
      {
        url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=800&fit=crop",
        category: "kitchen",
      },
    ],
  },
  {
    title: "Newly Built Chamber & Hall Self-Contained",
    description:
      "Affordable self-contained chamber and hall in Madina. Own ECG prepaid meter, shared compound with security gate.",
    propertyType: "chamber_and_hall",
    pricePerMonth: 800,
    advancePeriod: "six_months",
    region: "Greater Accra",
    cityTown: "Accra",
    neighborhood: "Madina",
    latitude: 5.683,
    longitude: -0.166,
    bedrooms: 1,
    bathrooms: 1,
    squareFootage: 450,
    maxOccupants: 2,
    furnishing: "unfurnished",
    smokingAllowed: false,
    isDirectOwnerVerified: true,
    amenities: {
      hasPolytankWater: true,
      hasStandbyGenerator: false,
      hasAirConditioning: false,
      isWalledAndGated: true,
      hasSelfMeter: true,
      hasParkingSpace: false,
    },
    media: [
      {
        url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=800&fit=crop",
        category: "living_room",
      },
      {
        url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&h=800&fit=crop",
        category: "bedroom",
      },
    ],
  },
  {
    title: "Luxury 3-Bedroom House with Standby Generator",
    description:
      "Move-in ready 3-bedroom house near Cocoa Clinic, Spintex. Walled and gated, polytank water, standby generator.",
    propertyType: "house",
    pricePerMonth: 2200,
    advancePeriod: "one_year",
    region: "Greater Accra",
    cityTown: "Accra",
    neighborhood: "Spintex",
    latitude: 5.62,
    longitude: -0.08,
    bedrooms: 3,
    bathrooms: 2,
    squareFootage: 1800,
    maxOccupants: 6,
    furnishing: "semi_furnished",
    smokingAllowed: false,
    isDirectOwnerVerified: true,
    amenities: {
      hasPolytankWater: true,
      hasStandbyGenerator: true,
      hasAirConditioning: true,
      isWalledAndGated: true,
      hasSelfMeter: true,
      hasParkingSpace: true,
    },
    media: [
      {
        url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop",
        category: "exterior",
      },
      {
        url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=800&fit=crop",
        category: "living_room",
      },
    ],
  },
  {
    title: "Osu Short-Stay Studio near Oxford Street",
    description:
      "Stylish furnished studio for short stays. Walk to restaurants and nightlife. Self check-in and AC.",
    propertyType: "apartment",
    stayDuration: "short_stay",
    pricePerMonth: 4500,
    advancePeriod: "monthly",
    region: "Greater Accra",
    cityTown: "Accra",
    neighborhood: "Osu",
    latitude: 5.555,
    longitude: -0.176,
    bedrooms: 1,
    bathrooms: 1,
    squareFootage: 380,
    maxOccupants: 2,
    furnishing: "furnished",
    smokingAllowed: false,
    isDirectOwnerVerified: true,
    amenities: {
      hasPolytankWater: true,
      hasStandbyGenerator: false,
      hasAirConditioning: true,
      isWalledAndGated: true,
      hasSelfMeter: true,
      hasParkingSpace: false,
    },
    media: [
      {
        url: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&h=800&fit=crop",
        category: "living_room",
      },
      {
        url: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=1200&h=800&fit=crop",
        category: "bedroom",
      },
    ],
  },
  {
    title: "Labadi Beachside 2-Bed Short-Stay House",
    description:
      "Furnished 2-bedroom house in Labadi, a few minutes from the beach road. Solar-backed power, standby generator, and polytank water. Direct from owner for short stays of a few weeks or more.",
    propertyType: "house",
    stayDuration: "short_stay",
    pricePerMonth: 3000,
    advancePeriod: "monthly",
    region: "Greater Accra",
    cityTown: "Accra",
    neighborhood: "Labadi",
    latitude: 5.5575,
    longitude: -0.1386,
    bedrooms: 2,
    bathrooms: 2,
    squareFootage: 950,
    maxOccupants: 4,
    furnishing: "furnished",
    smokingAllowed: false,
    isDirectOwnerVerified: true,
    amenities: {
      hasPolytankWater: true,
      hasStandbyGenerator: true,
      hasSolar: true,
      hasAirConditioning: true,
      isWalledAndGated: true,
      hasSelfMeter: true,
      hasParkingSpace: true,
    },
    media: [
      {
        url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop",
        category: "exterior",
      },
      {
        url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&h=800&fit=crop",
        category: "living_room",
      },
      {
        url: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200&h=800&fit=crop",
        category: "bedroom",
      },
    ],
  },
  {
    title: "Dzorwulu Furnished 3-Bed Short-Stay House",
    description:
      "Family-sized furnished house in Dzorwulu with a walled compound, parking, and AC in every room. Ideal for visiting families, consultants, and relocation stays. No agent fees.",
    propertyType: "house",
    stayDuration: "short_stay",
    pricePerMonth: 3600,
    advancePeriod: "monthly",
    region: "Greater Accra",
    cityTown: "Accra",
    neighborhood: "Dzorwulu",
    latitude: 5.5962,
    longitude: -0.2045,
    bedrooms: 3,
    bathrooms: 2,
    squareFootage: 1500,
    maxOccupants: 6,
    furnishing: "furnished",
    smokingAllowed: false,
    isDirectOwnerVerified: true,
    amenities: {
      hasPolytankWater: true,
      hasStandbyGenerator: true,
      hasSolar: false,
      hasAirConditioning: true,
      isWalledAndGated: true,
      hasSelfMeter: true,
      hasParkingSpace: true,
    },
    media: [
      {
        url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop",
        category: "exterior",
      },
      {
        url: "https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=1200&h=800&fit=crop",
        category: "kitchen",
      },
      {
        url: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200&h=800&fit=crop",
        category: "bedroom",
      },
    ],
  },
  {
    title: "Quiet 3-Bedroom Apartment in Ahodwo",
    description:
      "Spacious apartment in Ahodwo, Kumasi. Family-friendly neighborhood with parking and gated access.",
    propertyType: "apartment",
    pricePerMonth: 1800,
    advancePeriod: "one_year",
    region: "Ashanti",
    cityTown: "Kumasi",
    neighborhood: "Ahodwo",
    latitude: 6.666,
    longitude: -1.616,
    bedrooms: 3,
    bathrooms: 2,
    squareFootage: 1400,
    maxOccupants: 5,
    furnishing: "unfurnished",
    smokingAllowed: false,
    isDirectOwnerVerified: false,
    amenities: {
      hasPolytankWater: true,
      hasStandbyGenerator: false,
      hasAirConditioning: false,
      isWalledAndGated: true,
      hasSelfMeter: true,
      hasParkingSpace: true,
    },
    media: [
      {
        url: "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=1200&h=800&fit=crop",
        category: "living_room",
      },
      {
        url: "https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=1200&h=800&fit=crop",
        category: "bedroom",
      },
    ],
  },
  {
    title: "Airport Residential 2-Bed Listed by Agent",
    description:
      "Bright 2-bedroom apartment near Airport Residential, managed by a verified letting agent. Fitted kitchen, standby light, and parking for one car. Viewings arranged in-app.",
    propertyType: "apartment",
    pricePerMonth: 2800,
    advancePeriod: "six_months",
    region: "Greater Accra",
    cityTown: "Accra",
    neighborhood: "Airport Residential",
    digitalAddressGhanapost: "GA-150-8842",
    latitude: 5.605,
    longitude: -0.178,
    bedrooms: 2,
    bathrooms: 2,
    squareFootage: 1100,
    maxOccupants: 4,
    furnishing: "semi_furnished",
    smokingAllowed: false,
    isDirectOwnerVerified: false,
    listingActorType: "agent",
    amenities: {
      hasPolytankWater: true,
      hasStandbyGenerator: true,
      hasAirConditioning: true,
      isWalledAndGated: true,
      hasSelfMeter: true,
      hasParkingSpace: true,
    },
    media: [
      {
        url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=800&fit=crop",
        category: "living_room",
      },
      {
        url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop",
        category: "bedroom",
      },
      {
        url: "https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=1200&h=800&fit=crop",
        category: "kitchen",
      },
    ],
  },
  {
    title: "Labadi Beach Road Chamber & Hall (Agent)",
    description:
      "Self-contained chamber and hall on Labadi Beach Road. Verified agent handles viewings, applications, and deposit handover on Ashesi Pa.",
    propertyType: "chamber_and_hall",
    pricePerMonth: 950,
    advancePeriod: "six_months",
    region: "Greater Accra",
    cityTown: "Accra",
    neighborhood: "Labadi",
    latitude: 5.568,
    longitude: -0.152,
    bedrooms: 1,
    bathrooms: 1,
    squareFootage: 420,
    maxOccupants: 2,
    furnishing: "unfurnished",
    smokingAllowed: false,
    isDirectOwnerVerified: false,
    listingActorType: "agent",
    amenities: {
      hasPolytankWater: true,
      hasStandbyGenerator: false,
      hasAirConditioning: false,
      isWalledAndGated: true,
      hasSelfMeter: true,
      hasParkingSpace: false,
    },
    media: [
      {
        url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop",
        category: "living_room",
      },
      {
        url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&h=800&fit=crop",
        category: "bedroom",
      },
    ],
  },
  {
    title: "Tema Community 25 Family House via Agent",
    description:
      "4-bedroom family house in Tema Community 25 with compound parking and polytank water. Listed and managed by a verified letting agent for accountable lettings.",
    propertyType: "house",
    pricePerMonth: 3200,
    advancePeriod: "one_year",
    region: "Greater Accra",
    cityTown: "Tema",
    neighborhood: "Community 25",
    latitude: 5.669,
    longitude: -0.017,
    bedrooms: 4,
    bathrooms: 3,
    squareFootage: 2100,
    maxOccupants: 8,
    furnishing: "semi_furnished",
    smokingAllowed: false,
    isDirectOwnerVerified: false,
    listingActorType: "agent",
    amenities: {
      hasPolytankWater: true,
      hasStandbyGenerator: true,
      hasAirConditioning: false,
      isWalledAndGated: true,
      hasSelfMeter: true,
      hasParkingSpace: true,
    },
    media: [
      {
        url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop",
        category: "exterior",
      },
      {
        url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&h=800&fit=crop",
        category: "living_room",
      },
      {
        url: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200&h=800&fit=crop",
        category: "bedroom",
      },
    ],
  },
  {
    title: "East Legon Executive Flat — Accra Homes Ltd",
    description:
      "Corporate-managed 3-bedroom flat in East Legon. Listed by Accra Homes Ltd with deposit handover and tenancy tracking on Ashesi Pa.",
    propertyType: "apartment",
    pricePerMonth: 4000,
    advancePeriod: "one_year",
    region: "Greater Accra",
    cityTown: "Accra",
    neighborhood: "East Legon",
    digitalAddressGhanapost: "GA-292-5501",
    latitude: 5.638,
    longitude: -0.151,
    bedrooms: 3,
    bathrooms: 3,
    squareFootage: 1600,
    maxOccupants: 6,
    furnishing: "furnished",
    smokingAllowed: false,
    isDirectOwnerVerified: false,
    listingActorType: "firm",
    amenities: {
      hasPolytankWater: true,
      hasStandbyGenerator: true,
      hasAirConditioning: true,
      isWalledAndGated: true,
      hasSelfMeter: true,
      hasParkingSpace: true,
    },
    media: [
      {
        url: "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=1200&h=800&fit=crop",
        category: "living_room",
      },
      {
        url: "https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=1200&h=800&fit=crop",
        category: "bedroom",
      },
    ],
  },
  {
    title: "Labone 2-Bed Apartment with Balcony",
    description:
      "Bright furnished apartment in Labone with a private balcony, prepaid meter, and secure parking. Ideal for professionals who want Accra access without an agent markup.",
    propertyType: "apartment",
    pricePerMonth: 3200,
    advancePeriod: "six_months",
    region: "Greater Accra",
    cityTown: "Accra",
    neighborhood: "Labone",
    digitalAddressGhanapost: "GA-154-2208",
    latitude: 5.5665,
    longitude: -0.1705,
    bedrooms: 2,
    bathrooms: 2,
    squareFootage: 1100,
    maxOccupants: 4,
    furnishing: "furnished",
    smokingAllowed: false,
    isDirectOwnerVerified: true,
    amenities: {
      hasPolytankWater: true,
      hasStandbyGenerator: true,
      hasSolar: false,
      hasAirConditioning: true,
      isWalledAndGated: true,
      hasSelfMeter: true,
      hasParkingSpace: true,
    },
    media: [
      {
        url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop",
        category: "living_room",
      },
      {
        url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop",
        category: "bedroom",
      },
      {
        url: "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=1200&h=800&fit=crop",
        category: "balcony",
      },
    ],
  },
  {
    title: "Ridge Contemporary 1-Bed Apartment",
    description:
      "Compact contemporary one-bedroom near Ridge Hospital. Part furnished, quiet compound, and reliable polytank water for long-stay tenants.",
    propertyType: "apartment",
    pricePerMonth: 2400,
    advancePeriod: "six_months",
    region: "Greater Accra",
    cityTown: "Accra",
    neighborhood: "Ridge",
    digitalAddressGhanapost: "GA-090-4412",
    latitude: 5.5602,
    longitude: -0.1968,
    bedrooms: 1,
    bathrooms: 1,
    squareFootage: 720,
    maxOccupants: 2,
    furnishing: "semi_furnished",
    smokingAllowed: false,
    isDirectOwnerVerified: true,
    amenities: {
      hasPolytankWater: true,
      hasStandbyGenerator: false,
      hasSolar: false,
      hasAirConditioning: true,
      isWalledAndGated: true,
      hasSelfMeter: true,
      hasParkingSpace: false,
    },
    media: [
      {
        url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=800&fit=crop",
        category: "living_room",
      },
      {
        url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&h=800&fit=crop",
        category: "bedroom",
      },
    ],
  },
  {
    title: "Dansoman Building Society Terrace House",
    description:
      "3-bedroom terrace listed by Greater Accra Building Society. Accountable lettings with clear deposit rules when the tenancy ends.",
    propertyType: "house",
    pricePerMonth: 2100,
    advancePeriod: "six_months",
    region: "Greater Accra",
    cityTown: "Accra",
    neighborhood: "Dansoman",
    latitude: 5.543,
    longitude: -0.265,
    bedrooms: 3,
    bathrooms: 2,
    squareFootage: 1350,
    maxOccupants: 5,
    furnishing: "semi_furnished",
    smokingAllowed: false,
    isDirectOwnerVerified: false,
    listingActorType: "firm",
    amenities: {
      hasPolytankWater: true,
      hasStandbyGenerator: false,
      hasAirConditioning: false,
      isWalledAndGated: true,
      hasSelfMeter: true,
      hasParkingSpace: true,
    },
    media: [
      {
        url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop",
        category: "exterior",
      },
      {
        url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=800&fit=crop",
        category: "living_room",
      },
    ],
  },
];

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 12);

  const kwame = await prisma.user.upsert({
    where: { email: "kwame@sheltergh.local" },
    update: {
      idVerificationStatus: "verified",
      ghanaCardNumber: "GHA-111111111-1",
    },
    create: {
      email: "kwame@sheltergh.local",
      phoneNumber: "+233244123456",
      fullName: "Kwame Osei",
      passwordHash,
      role: "landlord",
      idVerificationStatus: "verified",
      ghanaCardNumber: "GHA-111111111-1",
      avatarUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    },
  });

  const ama = await prisma.user.upsert({
    where: { email: "ama@sheltergh.local" },
    update: {
      idVerificationStatus: "verified",
      ghanaCardNumber: "GHA-222222222-2",
    },
    create: {
      email: "ama@sheltergh.local",
      phoneNumber: "+233201987654",
      fullName: "Ama Mensah",
      passwordHash,
      role: "landlord",
      idVerificationStatus: "verified",
      ghanaCardNumber: "GHA-222222222-2",
      avatarUrl:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    },
  });

  await prisma.user.upsert({
    where: { email: "renter@sheltergh.local" },
    update: {
      idVerificationStatus: "unverified",
      ghanaCardNumber: null,
    },
    create: {
      email: "renter@sheltergh.local",
      phoneNumber: "+233557000111",
      fullName: "Yaw Asante",
      passwordHash,
      role: "renter",
      idVerificationStatus: "unverified",
    },
  });

  const agent = await prisma.user.upsert({
    where: { email: "agent@sheltergh.local" },
    update: {
      role: "agent",
      idVerificationStatus: "verified",
      ghanaCardNumber: "GHA-333333333-3",
    },
    create: {
      email: "agent@sheltergh.local",
      phoneNumber: "+233244998877",
      fullName: "Kojo Boateng",
      passwordHash,
      role: "agent",
      idVerificationStatus: "verified",
      ghanaCardNumber: "GHA-333333333-3",
      avatarUrl:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@sheltergh.local" },
    update: {
      role: "admin",
      idVerificationStatus: "verified",
    },
    create: {
      email: "admin@sheltergh.local",
      phoneNumber: "+233200000000",
      fullName: "Ashesi Pa Admin",
      passwordHash,
      role: "admin",
      idVerificationStatus: "verified",
    },
  });

  const firm = await prisma.user.upsert({
    where: { email: "firm@sheltergh.local" },
    update: {
      role: "firm",
      companyName: "Accra Homes Ltd",
      idVerificationStatus: "verified",
      ghanaCardNumber: "GHA-444444444-4",
    },
    create: {
      email: "firm@sheltergh.local",
      phoneNumber: "+233302556677",
      fullName: "Abena Owusu",
      companyName: "Accra Homes Ltd",
      passwordHash,
      role: "firm",
      idVerificationStatus: "verified",
      ghanaCardNumber: "GHA-444444444-4",
      avatarUrl:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop",
    },
  });

  async function createListing(
    listing: SeedListing,
    landlordId: string,
    actorType: "owner" | "agent" | "firm"
  ) {
    await prisma.property.create({
      data: {
        landlordId,
        listingActorType: actorType,
        title: listing.title,
        description: listing.description,
        propertyType: listing.propertyType,
        pricePerMonth: listing.pricePerMonth,
        advancePeriod: listing.advancePeriod,
        securityDeposit: listing.pricePerMonth,
        region: listing.region,
        cityTown: listing.cityTown,
        neighborhood: listing.neighborhood,
        digitalAddressGhanapost: listing.digitalAddressGhanapost,
        latitude: listing.latitude,
        longitude: listing.longitude,
        locationVerified: true,
        gpsCapturedAt: new Date(),
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        squareFootage: listing.squareFootage,
        maxOccupants: listing.maxOccupants,
        stayDuration:
          listing.stayDuration ??
          (listing.propertyType === "short_stay" ? "short_stay" : "long_stay"),
        furnishing: listing.furnishing,
        smokingAllowed: listing.smokingAllowed,
        isDirectOwnerVerified:
          actorType === "owner" ? listing.isDirectOwnerVerified : false,
        amenities: {
          create: {
            ...listing.amenities,
            hasSolar: listing.amenities.hasSolar ?? false,
          },
        },
        media: {
          create: listing.media.map((m, idx) => ({
            mediaUrl: m.url,
            mediaType: "image",
            category: m.category,
            displayOrder: idx,
          })),
        },
      },
    });
  }

  const existingCount = await prisma.property.count();
  if (existingCount === 0) {
    let ownerIndex = 0;
    for (const listing of listings) {
      const actorType = listing.listingActorType ?? "owner";
      const landlordId =
        actorType === "agent"
          ? agent.id
          : actorType === "firm"
            ? firm.id
            : ownerIndex++ % 2 === 0
              ? kwame.id
              : ama.id;
      await createListing(listing, landlordId, actorType);
    }
    console.log("Seeded demo listings");
  } else {
    for (const listing of listings) {
      const actorType = listing.listingActorType ?? "owner";
      const hostId =
        actorType === "agent"
          ? agent.id
          : actorType === "firm"
            ? firm.id
            : undefined;
      const existing = await prisma.property.findFirst({
        where: { title: listing.title },
        select: { id: true },
      });
      if (existing) {
        await prisma.property.update({
          where: { id: existing.id },
          data: {
            description: listing.description,
            maxOccupants: listing.maxOccupants,
            stayDuration:
              listing.stayDuration ??
              (listing.propertyType === "short_stay"
                ? "short_stay"
                : "long_stay"),
            furnishing: listing.furnishing,
            smokingAllowed: listing.smokingAllowed,
            securityDeposit: listing.pricePerMonth,
            listingActorType: actorType,
            landlordId: hostId,
            isDirectOwnerVerified:
              actorType === "owner" ? listing.isDirectOwnerVerified : false,
          },
        });
      } else {
        await createListing(
          listing,
          hostId ?? kwame.id,
          actorType
        );
        console.log(`Seeded new listing: ${listing.title}`);
      }
    }
    console.log(
      `Seed synced ${listings.length} listings (${await prisma.property.count()} total)`
    );
  }

  const experienceCount = await prisma.experience.count();
  if (experienceCount === 0) {
    await prisma.experience.createMany({
      data: [
        {
          title: "Accra Street Food Night Walk",
          description:
            "Taste kelewele, waakye, and grilled tilapia with a local host through Osu and Labadi night spots.",
          category: "food",
          hostName: "Ama K.",
          region: "Greater Accra",
          cityTown: "Accra",
          neighborhood: "Osu",
          latitude: 5.5557,
          longitude: -0.1826,
          priceGhs: 180,
          durationHours: 3,
          imageUrl:
            "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop",
          rating: 4.9,
          reviewCount: 64,
        },
        {
          title: "Jamestown Lighthouse & Fishing Culture",
          description:
            "Climb the lighthouse, meet canoe fishermen, and learn Jamestown history with a community guide.",
          category: "culture",
          hostName: "Kofi Mensah",
          region: "Greater Accra",
          cityTown: "Accra",
          neighborhood: "Jamestown",
          latitude: 5.5335,
          longitude: -0.2116,
          priceGhs: 120,
          durationHours: 2.5,
          imageUrl:
            "https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=800&h=600&fit=crop",
          rating: 4.8,
          reviewCount: 41,
        },
        {
          title: "Labadi Beach Sunset Session",
          description:
            "Beach games, live music vibes, and coconut coolers as the Accra sun sets over the Gulf of Guinea.",
          category: "beach",
          hostName: "Naa Adjeley",
          region: "Greater Accra",
          cityTown: "Accra",
          neighborhood: "Labadi",
          latitude: 5.5608,
          longitude: -0.1486,
          priceGhs: 150,
          durationHours: 3,
          imageUrl:
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop",
          rating: 4.7,
          reviewCount: 88,
        },
        {
          title: "Makola Market Morning Tour",
          description:
            "Navigate Accra’s busiest market with a local — spices, fabrics, and bargaining tips included.",
          category: "market",
          hostName: "Efua Boateng",
          region: "Greater Accra",
          cityTown: "Accra",
          neighborhood: "Makola",
          latitude: 5.5486,
          longitude: -0.211,
          priceGhs: 90,
          durationHours: 2,
          imageUrl:
            "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&h=600&fit=crop",
          rating: 4.6,
          reviewCount: 53,
        },
        {
          title: "Kwame Nkrumah Memorial Walk",
          description:
            "Guided history walk through Independence Square and the Nkrumah Mausoleum gardens.",
          category: "history",
          hostName: "Yaw Asante",
          region: "Greater Accra",
          cityTown: "Accra",
          neighborhood: "Ministries",
          latitude: 5.5446,
          longitude: -0.2017,
          priceGhs: 100,
          durationHours: 2,
          imageUrl:
            "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop",
          rating: 4.8,
          reviewCount: 37,
        },
        {
          title: "Kumasi Cultural Bead & Kente Workshop",
          description:
            "Visit a bead market and try a short kente weaving demo with Ashanti artisans near Kejetia.",
          category: "culture",
          hostName: "Akosua Frimpong",
          region: "Ashanti",
          cityTown: "Kumasi",
          neighborhood: "Adum",
          latitude: 6.6885,
          longitude: -1.6244,
          priceGhs: 200,
          durationHours: 3.5,
          imageUrl:
            "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800&h=600&fit=crop",
          rating: 4.9,
          reviewCount: 29,
        },
        {
          title: "Lake Bosomtwe Nature Escape",
          description:
            "Day trip vibe near Kumasi — lakeside walks, canoeing, and local grilled fish lunch.",
          category: "nature",
          hostName: "Kwaku Darko",
          region: "Ashanti",
          cityTown: "Kumasi",
          neighborhood: "Ahodwo",
          latitude: 6.5053,
          longitude: -1.4094,
          priceGhs: 280,
          durationHours: 6,
          imageUrl:
            "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&h=600&fit=crop",
          rating: 4.8,
          reviewCount: 22,
        },
        {
          title: "Cape Coast Castle Heritage Tour",
          description:
            "Deep dive into Cape Coast Castle with a licensed guide — history, resilience, and coastal views.",
          category: "history",
          hostName: "Esi Quansah",
          region: "Central",
          cityTown: "Cape Coast",
          neighborhood: "Castle Area",
          latitude: 5.1036,
          longitude: -1.2419,
          priceGhs: 160,
          durationHours: 2.5,
          imageUrl:
            "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&h=600&fit=crop",
          rating: 4.9,
          reviewCount: 71,
        },
        {
          title: "Kakum Canopy Walk Adventure",
          description:
            "Walk the rainforest canopy bridges and learn rainforest ecology with a park guide.",
          category: "adventure",
          hostName: "Fiifi Mensah",
          region: "Central",
          cityTown: "Cape Coast",
          neighborhood: "Kakum",
          latitude: 5.35,
          longitude: -1.3833,
          priceGhs: 220,
          durationHours: 4,
          imageUrl:
            "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop",
          rating: 4.7,
          reviewCount: 95,
        },
        {
          title: "Tamale Night Market & Music",
          description:
            "Sample Northern dishes and enjoy live local music around Tamale’s evening markets.",
          category: "nightlife",
          hostName: "Abdul Razak",
          region: "Northern",
          cityTown: "Tamale",
          neighborhood: "Lamashegu",
          latitude: 9.4034,
          longitude: -0.8424,
          priceGhs: 140,
          durationHours: 3,
          imageUrl:
            "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=600&fit=crop",
          rating: 4.6,
          reviewCount: 18,
        },
      ],
    });
    console.log("Seeded Ghana experiences");
  } else {
    console.log(`Seed skipped experiences (${experienceCount} already exist)`);
  }

  console.log("Demo login: kwame@sheltergh.local / Password123! (landlord)");
  console.log("Demo login: agent@sheltergh.local / Password123! (agent)");
  console.log("Demo login: firm@sheltergh.local / Password123! (firm)");
  console.log("Demo login: renter@sheltergh.local / Password123!");
  console.log("Demo login: admin@sheltergh.local / Password123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
