import { mapAgreement } from "@/lib/agreements";
import { prisma } from "@/lib/db";
import type {
  AdvanceReceiptStatus,
  BillPayer,
  DepositHandoverDto,
  PaymentFrequency,
  RentLedgerEntryDto,
  RentalRequestDto,
  RentalRequestKind,
} from "@/lib/types";

const OPEN_STATUSES = ["requested", "accepted"] as const;
const ADVANCE_MONTHS: Record<PaymentFrequency, number> = {
  monthly: 1,
  six_months: 6,
  one_year: 12,
  two_years: 24,
};
const BILL_LABEL: Record<BillPayer, string> = {
  tenant: "tenant pays",
  landlord: "landlord pays",
  shared: "shared",
};

function dateOnly(value: Date | null) {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

function rulesText(property: {
  petsAllowed: boolean;
  smokingAllowed: boolean;
  quietHours: string | null;
  maxOccupants: number | null;
  houseRules: string | null;
  billsElectricity: BillPayer;
  billsWater: BillPayer;
  billsInternet: BillPayer;
}) {
  const lines = [
    `Pets: ${property.petsAllowed ? "allowed" : "not allowed"}`,
    `Smoking: ${property.smokingAllowed ? "allowed" : "not allowed (no smoking)"}`,
    property.quietHours ? `Quiet hours: ${property.quietHours}` : null,
    property.maxOccupants
      ? `Maximum persons who can stay: ${property.maxOccupants}`
      : null,
    "Security deposit may be charged for damage, missing items, or unpaid bills when the tenant leaves or the stay ends; any balance is returned after handover.",
    `ECG: ${BILL_LABEL[property.billsElectricity]}`,
    `Water: ${BILL_LABEL[property.billsWater]}`,
    `Internet: ${BILL_LABEL[property.billsInternet]}`,
    property.houseRules,
  ];
  return lines.filter(Boolean).join("\n");
}

type RequestRow = {
  id: string;
  propertyId: string;
  property: {
    title: string;
    accessInstructions: string | null;
  };
  kind: RentalRequestKind;
  status: RentalRequestDto["status"];
  message: string | null;
  viewingAt: Date | null;
  moveInDate: Date | null;
  offeredAdvance: PaymentFrequency | null;
  advanceReceipt: AdvanceReceiptStatus;
  landlordNote: string | null;
  monthlyIncome: { toString(): string } | null;
  employmentStatus: string | null;
  previousLandlordName: string | null;
  previousLandlordPhone: string | null;
  previousLandlordNote: string | null;
  agreedPrice: { toString(): string } | null;
  agreedDeposit: { toString(): string } | null;
  agreedAdvance: PaymentFrequency | null;
  agreedMoveIn: Date | null;
  agreedRules: string | null;
  holdUntil: Date | null;
  renterId: string;
  renter: { fullName: string };
  landlordId: string;
  createdAt: Date;
  ledger: {
    id: string;
    label: string;
    amount: { toString(): string };
    dueDate: Date;
    status: RentLedgerEntryDto["status"];
  }[];
  handover: {
    conditionNote: string | null;
    deductions: { toString(): string };
    returnedAmount: { toString(): string } | null;
    landlordConfirmed: boolean;
    renterConfirmed: boolean;
  } | null;
  agreement: {
    body: string;
    landlordSignedName: string;
    landlordSignedAt: Date;
    renterSignedName: string | null;
    renterSignedAt: Date | null;
  } | null;
  landlord: { fullName: string };
};

export function mapRentalRequest(row: RequestRow, viewerId: string): RentalRequestDto {
  const revealAccess = row.status === "accepted" || row.status === "completed";
  const ledger: RentLedgerEntryDto[] = row.ledger.map((entry) => ({
    id: entry.id,
    label: entry.label,
    amount: Number(entry.amount),
    due_date: dateOnly(entry.dueDate) ?? "",
    status: entry.status,
  }));
  const handover: DepositHandoverDto | null = row.handover
    ? {
        condition_note: row.handover.conditionNote,
        deductions: Number(row.handover.deductions),
        returned_amount:
          row.handover.returnedAmount != null ? Number(row.handover.returnedAmount) : null,
        landlord_confirmed: row.handover.landlordConfirmed,
        renter_confirmed: row.handover.renterConfirmed,
      }
    : null;

  return {
    id: row.id,
    property_id: row.propertyId,
    property_title: row.property.title,
    kind: row.kind,
    status: row.status,
    message: row.message,
    viewing_at: row.viewingAt?.toISOString() ?? null,
    move_in_date: dateOnly(row.moveInDate),
    offered_advance: row.offeredAdvance,
    advance_receipt: row.advanceReceipt,
    landlord_note: row.landlordNote,
    monthly_income: row.monthlyIncome != null ? Number(row.monthlyIncome) : null,
    employment_status: row.employmentStatus,
    previous_landlord_name: row.previousLandlordName,
    previous_landlord_phone: row.previousLandlordPhone,
    previous_landlord_note: row.previousLandlordNote,
    agreed_price: row.agreedPrice != null ? Number(row.agreedPrice) : null,
    agreed_deposit: row.agreedDeposit != null ? Number(row.agreedDeposit) : null,
    agreed_advance: row.agreedAdvance,
    agreed_move_in: dateOnly(row.agreedMoveIn),
    agreed_rules: row.agreedRules,
    hold_until: row.holdUntil?.toISOString() ?? null,
    access_instructions: revealAccess ? row.property.accessInstructions : null,
    ledger,
    handover,
    agreement: row.agreement ? mapAgreement(row.agreement) : null,
    renter_id: row.renterId,
    renter_name: row.renter.fullName,
    landlord_name: row.landlord.fullName,
    landlord_id: row.landlordId,
    created_at: row.createdAt.toISOString(),
    is_landlord: row.landlordId === viewerId,
  };
}

const includeParties = {
  property: {
    select: {
      title: true,
      accessInstructions: true,
    },
  },
  renter: { select: { fullName: true } },
  landlord: { select: { fullName: true } },
  ledger: true,
  handover: true,
  agreement: true,
} as const;

export async function listRentalRequestsForUser(userId: string) {
  const rows = await prisma.rentalRequest.findMany({
    where: { OR: [{ renterId: userId }, { landlordId: userId }] },
    include: includeParties,
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => mapRentalRequest(row, userId));
}

export async function createRentalRequest(input: {
  propertyId: string;
  renterId: string;
  kind: RentalRequestKind;
  message?: string;
  viewingAt?: string;
  moveInDate?: string;
  offeredAdvance?: PaymentFrequency;
  monthlyIncome?: number;
  employmentStatus?: string;
  previousLandlordName?: string;
  previousLandlordPhone?: string;
  previousLandlordNote?: string;
}) {
  const property = await prisma.property.findUnique({
    where: { id: input.propertyId },
    select: {
      id: true,
      landlordId: true,
      isActive: true,
      availability: true,
      advancePeriod: true,
    },
  });
  if (!property || !property.isActive) {
    return { error: "This home is not available" as const, request: null };
  }
  if (property.availability === "held") {
    return { error: "This home is held for another applicant" as const, request: null };
  }
  if (property.availability !== "available") {
    return { error: "This home is not taking new renters" as const, request: null };
  }
  if (property.landlordId === input.renterId) {
    return { error: "You can't request your own listing" as const, request: null };
  }

  const open = await prisma.rentalRequest.findFirst({
    where: {
      propertyId: property.id,
      renterId: input.renterId,
      kind: input.kind,
      status: { in: [...OPEN_STATUSES] },
    },
  });
  if (open) {
    return {
      error: "You already have an open request for this home" as const,
      request: null,
    };
  }

  let viewingAt: Date | undefined;
  let moveInDate: Date | undefined;
  if (input.kind === "tour") {
    if (!input.viewingAt) {
      return { error: "Choose a time for the viewing" as const, request: null };
    }
    viewingAt = new Date(input.viewingAt);
    if (Number.isNaN(viewingAt.getTime()) || viewingAt.getTime() < Date.now()) {
      return { error: "Pick a viewing time in the future" as const, request: null };
    }
  } else {
    if (!input.moveInDate) {
      return { error: "Choose a move-in date" as const, request: null };
    }
    if (!input.monthlyIncome || !input.employmentStatus) {
      return {
        error: "Add your monthly income and whether you work or study" as const,
        request: null,
      };
    }
    moveInDate = new Date(`${input.moveInDate}T00:00:00.000Z`);
    if (Number.isNaN(moveInDate.getTime())) {
      return { error: "Move-in date is invalid" as const, request: null };
    }
  }

  const created = await prisma.rentalRequest.create({
    data: {
      propertyId: property.id,
      renterId: input.renterId,
      landlordId: property.landlordId,
      kind: input.kind,
      message: input.message,
      viewingAt,
      moveInDate,
      offeredAdvance:
        input.kind === "application"
          ? (input.offeredAdvance ?? property.advancePeriod)
          : undefined,
      monthlyIncome: input.monthlyIncome,
      employmentStatus: input.employmentStatus,
      previousLandlordName: input.previousLandlordName,
      previousLandlordPhone: input.previousLandlordPhone,
      previousLandlordNote: input.previousLandlordNote,
    },
    include: includeParties,
  });

  return { error: null, request: mapRentalRequest(created, input.renterId) };
}

export async function updateRentalRequest(input: {
  requestId: string;
  actorId: string;
  action: "accept" | "decline" | "cancel" | "confirm_receipt" | "complete";
  landlordNote?: string;
}) {
  const row = await prisma.rentalRequest.findUnique({
    where: { id: input.requestId },
    include: {
      property: true,
    },
  });
  if (!row) return { error: "Request not found" as const, request: null };

  const isLandlord = row.landlordId === input.actorId;
  const isRenter = row.renterId === input.actorId;
  if (!isLandlord && !isRenter) {
    return { error: "Not your request" as const, request: null };
  }

  if (input.action === "cancel") {
    if (!isRenter) return { error: "Only the renter can cancel" as const, request: null };
    if (row.status !== "requested" && row.status !== "accepted") {
      return { error: "This request is already closed" as const, request: null };
    }
    const signed = await prisma.tenancyAgreement.findUnique({
      where: { rentalRequestId: row.id },
      select: { renterSignedAt: true },
    });
    if (signed?.renterSignedAt) {
      return { error: "A signed agreement is already on this tenancy" as const, request: null };
    }
    const updated = await prisma.$transaction(async (tx) => {
      await tx.tenancyAgreement.deleteMany({ where: { rentalRequestId: row.id } });
      const next = await tx.rentalRequest.update({
        where: { id: row.id },
        data: { status: "cancelled", decidedAt: new Date() },
        include: includeParties,
      });
      if (row.kind === "application" && row.status === "accepted" && row.property.availability === "held") {
        await tx.property.update({
          where: { id: row.propertyId },
          data: { availability: "available" },
        });
      }
      return next;
    });
    return { error: null, request: mapRentalRequest(updated, input.actorId) };
  }

  if (!isLandlord) {
    return { error: "Only the landlord can do that" as const, request: null };
  }

  if (input.action === "accept" || input.action === "decline") {
    if (row.status !== "requested") {
      return { error: "This request is no longer waiting" as const, request: null };
    }
    if (input.action === "accept" && row.kind === "application" && row.property.availability === "held") {
      return { error: "This home is already held for another applicant" as const, request: null };
    }

    const holdUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.rentalRequest.update({
        where: { id: row.id },
        data: {
          status: input.action === "accept" ? "accepted" : "declined",
          landlordNote: input.landlordNote,
          decidedAt: new Date(),
          ...(input.action === "accept" && row.kind === "application"
            ? {
                agreedPrice: row.property.pricePerMonth,
                agreedDeposit: row.property.securityDeposit,
                agreedAdvance: row.offeredAdvance ?? row.property.advancePeriod,
                agreedMoveIn: row.moveInDate,
                agreedRules: rulesText(row.property),
                holdUntil,
              }
            : {}),
        },
        include: includeParties,
      });
      if (input.action === "accept" && row.kind === "application") {
        await tx.property.update({
          where: { id: row.propertyId },
          data: { availability: "held" },
        });
        await tx.rentalRequest.updateMany({
          where: {
            propertyId: row.propertyId,
            id: { not: row.id },
            status: { in: [...OPEN_STATUSES] },
          },
          data: {
            status: "declined",
            landlordNote: "Held for another applicant",
            decidedAt: new Date(),
          },
        });
      }
      return next;
    });
    return { error: null, request: mapRentalRequest(updated, input.actorId) };
  }

  if (input.action === "confirm_receipt") {
    if (row.kind !== "application") {
      return { error: "Viewings don't record an advance" as const, request: null };
    }
    if (row.status !== "accepted" && row.status !== "completed") {
      return { error: "Accept the application before recording payment" as const, request: null };
    }
    const updated = await prisma.rentalRequest.update({
      where: { id: row.id },
      data: { advanceReceipt: "landlord_confirmed" },
      include: includeParties,
    });
    return { error: null, request: mapRentalRequest(updated, input.actorId) };
  }

  if (row.status !== "accepted") {
    return { error: "Accept the request before completing it" as const, request: null };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.rentalRequest.update({
      where: { id: row.id },
      data: { status: "completed", decidedAt: new Date() },
      include: includeParties,
    });
    if (row.kind === "application") {
      const advance = row.agreedAdvance ?? row.offeredAdvance ?? row.property.advancePeriod;
      const price = Number(row.agreedPrice ?? row.property.pricePerMonth);
      const due = row.agreedMoveIn ?? row.moveInDate ?? new Date();
      await tx.rentLedgerEntry.create({
        data: {
          rentalRequestId: row.id,
          label: "Advance",
          amount: price * ADVANCE_MONTHS[advance],
          dueDate: due,
          status: row.advanceReceipt === "landlord_confirmed" ? "received" : "expected",
        },
      });
      await tx.depositHandover.create({
        data: { rentalRequestId: row.id },
      });
      await tx.property.update({
        where: { id: row.propertyId },
        data: { availability: "rented", isActive: false },
      });
      await tx.rentalRequest.updateMany({
        where: {
          propertyId: row.propertyId,
          id: { not: row.id },
          status: { in: [...OPEN_STATUSES] },
        },
        data: {
          status: "declined",
          landlordNote: "This home has been rented",
          decidedAt: new Date(),
        },
      });
    }
    return tx.rentalRequest.findUniqueOrThrow({
      where: { id: next.id },
      include: includeParties,
    });
  });

  return { error: null, request: mapRentalRequest(updated, input.actorId) };
}

export async function renterHasCompletedStay(propertyId: string, renterId: string) {
  const stay = await prisma.rentalRequest.findFirst({
    where: {
      propertyId,
      renterId,
      kind: "application",
      status: "completed",
    },
    select: { id: true },
  });
  return Boolean(stay);
}

export async function saveHandover(input: {
  requestId: string;
  actorId: string;
  conditionNote?: string;
  deductions?: number;
  returnedAmount?: number;
  confirm?: boolean;
}) {
  const row = await prisma.rentalRequest.findUnique({
    where: { id: input.requestId },
    select: { id: true, renterId: true, landlordId: true, status: true, kind: true },
  });
  if (!row || row.kind !== "application" || row.status !== "completed") {
    return { error: "A handover opens after move-in" as const };
  }
  const isLandlord = row.landlordId === input.actorId;
  const isRenter = row.renterId === input.actorId;
  if (!isLandlord && !isRenter) return { error: "Not your tenancy" as const };

  await prisma.depositHandover.upsert({
    where: { rentalRequestId: row.id },
    create: {
      rentalRequestId: row.id,
      conditionNote: input.conditionNote,
      deductions: input.deductions ?? 0,
      returnedAmount: input.returnedAmount,
      landlordConfirmed: Boolean(isLandlord && input.confirm),
      renterConfirmed: Boolean(isRenter && input.confirm),
    },
    update: {
      conditionNote: input.conditionNote,
      deductions: input.deductions,
      returnedAmount: input.returnedAmount,
      ...(isLandlord && input.confirm ? { landlordConfirmed: true } : {}),
      ...(isRenter && input.confirm ? { renterConfirmed: true } : {}),
    },
  });
  return { error: null };
}

export async function setLedgerStatus(input: {
  requestId: string;
  actorId: string;
  entryId: string;
  status: "expected" | "received" | "late";
}) {
  const entry = await prisma.rentLedgerEntry.findUnique({
    where: { id: input.entryId },
    include: { rentalRequest: { select: { landlordId: true, id: true } } },
  });
  if (!entry || entry.rentalRequest.id !== input.requestId) {
    return { error: "Ledger entry not found" as const };
  }
  if (entry.rentalRequest.landlordId !== input.actorId) {
    return { error: "Only the landlord records rent" as const };
  }
  await prisma.rentLedgerEntry.update({
    where: { id: entry.id },
    data: { status: input.status },
  });
  return { error: null };
}
