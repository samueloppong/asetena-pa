import { prisma } from "@/lib/db";
import type {
  AdminVerificationRequest,
  MyVerificationStatus,
  VerificationDocumentType,
} from "@/lib/types";

export async function getMyVerificationStatus(
  userId: string
): Promise<MyVerificationStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { idVerificationStatus: true },
  });

  const latest = await prisma.identityVerificationRequest.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return {
    status: user?.idVerificationStatus ?? "unverified",
    latest_request: latest
      ? {
          id: latest.id,
          document_type: latest.documentType,
          status: latest.status,
          reviewer_notes: latest.reviewerNotes ?? undefined,
          created_at: latest.createdAt.toISOString(),
          reviewed_at: latest.reviewedAt?.toISOString(),
        }
      : null,
  };
}

/**
 * A user may only have one active (pending or verified) request at a time.
 * Resubmitting after a rejection is allowed.
 */
export async function submitVerification(
  userId: string,
  data: {
    documentType: VerificationDocumentType;
    idNumber: string;
    idPhotoUrl: string;
    selfieUrl: string;
  }
) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { idVerificationStatus: true },
  });
  if (existing?.idVerificationStatus === "verified") {
    return { error: "You're already verified" as const, request: null };
  }
  if (existing?.idVerificationStatus === "pending") {
    return {
      error: "Your last submission is still under review" as const,
      request: null,
    };
  }

  const [request] = await prisma.$transaction([
    prisma.identityVerificationRequest.create({ data: { userId, ...data } }),
    prisma.user.update({
      where: { id: userId },
      data: {
        idVerificationStatus: "pending",
        ghanaCardNumber:
          data.documentType === "ghana_card" ? data.idNumber : undefined,
      },
    }),
  ]);

  return { error: null, request };
}

export async function listPendingVerifications(): Promise<
  AdminVerificationRequest[]
> {
  const requests = await prisma.identityVerificationRequest.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: {
          fullName: true,
          email: true,
          role: true,
          companyName: true,
          registrationNumber: true,
        },
      },
    },
  });

  return requests.map((r) => ({
    id: r.id,
    document_type: r.documentType,
    status: r.status,
    reviewer_notes: r.reviewerNotes ?? undefined,
    created_at: r.createdAt.toISOString(),
    reviewed_at: r.reviewedAt?.toISOString(),
    user_id: r.userId,
    user_name: r.user.fullName,
    user_email: r.user.email,
    user_role: r.user.role,
    user_company_name: r.user.companyName ?? undefined,
    user_registration_number: r.user.registrationNumber ?? undefined,
    id_number: r.idNumber,
    id_photo_url: r.idPhotoUrl,
    selfie_url: r.selfieUrl,
  }));
}

export async function reviewVerification(
  requestId: string,
  decision: "verified" | "rejected",
  reviewerNotes?: string
) {
  const request = await prisma.identityVerificationRequest.findUnique({
    where: { id: requestId },
  });
  if (!request) return { error: "Request not found" as const };

  await prisma.$transaction([
    prisma.identityVerificationRequest.update({
      where: { id: requestId },
      data: { status: decision, reviewerNotes, reviewedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: request.userId },
      data: { idVerificationStatus: decision },
    }),
  ]);

  return { error: null };
}
