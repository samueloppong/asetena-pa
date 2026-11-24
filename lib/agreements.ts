import { prisma } from "@/lib/db";
import { ADVANCE_LABELS } from "@/lib/format";
import type { PaymentFrequency, TenancyAgreementDto } from "@/lib/types";

function sameName(left: string, right: string) {
  const normalize = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();
  return normalize(left) === normalize(right);
}

function ghs(amount: number) {
  return `GHS ${amount.toLocaleString("en-GH")}`;
}

export function mapAgreement(row: {
  body: string;
  landlordSignedName: string;
  landlordSignedAt: Date;
  renterSignedName: string | null;
  renterSignedAt: Date | null;
}): TenancyAgreementDto {
  return {
    body: row.body,
    landlord_signed_name: row.landlordSignedName,
    landlord_signed_at: row.landlordSignedAt.toISOString(),
    renter_signed_name: row.renterSignedName,
    renter_signed_at: row.renterSignedAt?.toISOString() ?? null,
  };
}

function agreementBody(input: {
  title: string;
  neighborhood: string;
  cityTown: string;
  region: string;
  digitalAddress: string | null;
  landlordName: string;
  renterName: string;
  price: number;
  deposit: number;
  advance: PaymentFrequency;
  moveIn: string | null;
  rules: string | null;
}) {
  return [
    "SHELTERGH TENANCY AGREEMENT",
    "",
    "This is the record of what these two people agreed on Ashesi Pa. It does not replace advice from a lawyer.",
    "",
    `Property: ${input.title}`,
    `Place: ${input.neighborhood}, ${input.cityTown}, ${input.region}`,
    `GhanaPost: ${input.digitalAddress ?? "not given"}`,
    "",
    `Landlord: ${input.landlordName}`,
    `Tenant: ${input.renterName}`,
    "",
    `Rent: ${ghs(input.price)} pcm`,
    `Security deposit: ${ghs(input.deposit)}`,
    `Advance: ${ADVANCE_LABELS[input.advance]}`,
    `Move-in date: ${input.moveIn ?? "not set"}`,
    "",
    "House rules and bills",
    input.rules?.trim() || "No extra house rules were recorded.",
    "",
    "The tenant pays the rent in advance for the period above.",
    "The landlord holds the security deposit. When the tenant leaves or the agreed stay ends, the landlord may charge the deposit for damage, missing items, or unpaid bills. Any balance left is returned after both sides confirm the deposit handover on Ashesi Pa.",
    "Each person signs by typing the full name on their Ashesi Pa account. The wording above does not change after the landlord signs.",
  ].join("\n");
}

export async function signTenancyAgreement(input: {
  requestId: string;
  actorId: string;
  signedName: string;
}) {
  const row = await prisma.rentalRequest.findUnique({
    where: { id: input.requestId },
    include: {
      agreement: true,
      property: true,
      renter: { select: { id: true, fullName: true } },
      landlord: { select: { id: true, fullName: true } },
    },
  });
  if (!row || (row.landlordId !== input.actorId && row.renterId !== input.actorId)) {
    return { error: "Not your tenancy" as const };
  }
  if (row.kind !== "application" || (row.status !== "accepted" && row.status !== "completed")) {
    return { error: "An agreement opens after the landlord accepts" as const };
  }
  if (row.agreedPrice == null || row.agreedDeposit == null || !row.agreedAdvance) {
    return { error: "This tenancy has no frozen terms to write down" as const };
  }

  if (!row.agreement) {
    if (row.landlordId !== input.actorId) {
      return { error: "The landlord signs first" as const };
    }
    if (!sameName(input.signedName, row.landlord.fullName)) {
      return { error: "Sign with the full name on your account" as const };
    }
    await prisma.tenancyAgreement.create({
      data: {
        rentalRequestId: row.id,
        landlordSignedName: row.landlord.fullName,
        body: agreementBody({
          title: row.property.title,
          neighborhood: row.property.neighborhood,
          cityTown: row.property.cityTown,
          region: row.property.region,
          digitalAddress: row.property.digitalAddressGhanapost,
          landlordName: row.landlord.fullName,
          renterName: row.renter.fullName,
          price: Number(row.agreedPrice),
          deposit: Number(row.agreedDeposit),
          advance: row.agreedAdvance,
          moveIn: row.agreedMoveIn ? row.agreedMoveIn.toISOString().slice(0, 10) : null,
          rules: row.agreedRules,
        }),
      },
    });
    return { error: null };
  }

  if (row.renterId !== input.actorId) {
    return { error: "You already signed this agreement" as const };
  }
  if (row.agreement.renterSignedAt) {
    return { error: "You already cosigned this agreement" as const };
  }
  if (!sameName(input.signedName, row.renter.fullName)) {
    return { error: "Cosign with the full name on your account" as const };
  }
  await prisma.tenancyAgreement.update({
    where: { id: row.agreement.id },
    data: {
      renterSignedName: row.renter.fullName,
      renterSignedAt: new Date(),
    },
  });
  return { error: null };
}
