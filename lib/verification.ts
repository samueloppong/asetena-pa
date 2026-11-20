import { prisma } from "@/lib/db";
import type { GhanaCardVerificationPayload } from "@/lib/validations";
import type {
  VerificationOverallResult,
  VerificationStatus,
} from "@prisma/client";

export const FACE_MATCH_THRESHOLD = 0.75;

const GHA_CARD_RE = /^GHA-[0-9]{9}-[0-9]$/;

export type VerificationChecks = {
  mrzMatch: boolean;
  chipAuthentic: boolean;
  faceMatch: boolean;
  niaLookupMatch: boolean;
};

/** Dev/stub NIA lookup: accepts well-formed Ghana Card numbers. */
export async function niaLookupMatch(nationalIdNumber: string): Promise<boolean> {
  if (!GHA_CARD_RE.test(nationalIdNumber)) return false;
  // Reserved fake reject for demo of REJECTED path
  if (nationalIdNumber === "GHA-000000000-0") return false;
  return true;
}

/**
 * Server-side scoring — never trust client overallResult alone.
 * Requires a real NFC chip provenance (jMRTD). Rejects mock / photo-only payloads.
 */
export async function scoreVerification(
  payload: GhanaCardVerificationPayload
): Promise<{
  checks: VerificationChecks;
  overallResult: VerificationOverallResult;
}> {
  const { mrzData, nfcChipData, biometrics, chipProvenance } = payload;
  const nationalId = nfcChipData.dg1PersonalDetails.nationalIdNumber;

  const isRealNfc =
    chipProvenance?.method === "nfc" &&
    Boolean(chipProvenance.library) &&
    nfcChipData.passiveAuthentication.documentSignerCertBase64 !== "MOCK_CERT";

  const mrzMatch =
    isRealNfc &&
    Boolean(mrzData.documentNumber) &&
    mrzData.documentNumber.length === 9 &&
    Boolean(mrzData.mrzRaw?.trim());

  const chipAuthentic =
    isRealNfc &&
    nfcChipData.passiveAuthentication.isValid &&
    nfcChipData.passiveAuthentication.documentSignerCertBase64.length > 20 &&
    (!nfcChipData.activeAuthentication.isSupported ||
      nfcChipData.activeAuthentication.isAuthentic);

  const faceMatch =
    biometrics.livenessPassed &&
    biometrics.faceMatchScore >= FACE_MATCH_THRESHOLD &&
    Boolean(biometrics.liveSelfieBase64) &&
    Boolean(nfcChipData.dg2FacePhotoBase64) &&
    nfcChipData.dg2FacePhotoBase64.length > 100;

  const niaOk = isRealNfc && (await niaLookupMatch(nationalId));

  const checks: VerificationChecks = {
    mrzMatch,
    chipAuthentic,
    faceMatch,
    niaLookupMatch: niaOk,
  };

  if (!isRealNfc) {
    return { checks, overallResult: "REJECTED" };
  }

  const hardFails = [mrzMatch, chipAuthentic, niaOk].filter((v) => !v).length;
  const softFails = faceMatch ? 0 : 1;

  let overallResult: VerificationOverallResult;
  if (hardFails === 0 && softFails === 0) {
    overallResult = "PASSED";
  } else if (hardFails >= 2 || !niaOk) {
    overallResult = "REJECTED";
  } else if (hardFails === 1 || softFails === 1) {
    overallResult = "FLAGGED_FOR_REVIEW";
  } else {
    overallResult = "REJECTED";
  }

  return { checks, overallResult };
}

export function overallToUserStatus(
  result: VerificationOverallResult
): VerificationStatus {
  if (result === "PASSED") return "verified";
  if (result === "FLAGGED_FOR_REVIEW") return "pending";
  return "rejected";
}

/** Strip large base64 blobs before persisting JSON. */
export function sanitizeVerificationPayload(
  payload: GhanaCardVerificationPayload
) {
  return {
    ...payload,
    nfcChipData: {
      ...payload.nfcChipData,
      dg2FacePhotoBase64: payload.nfcChipData.dg2FacePhotoBase64
        ? `[omitted ${payload.nfcChipData.dg2FacePhotoBase64.length} chars]`
        : "",
      passiveAuthentication: {
        ...payload.nfcChipData.passiveAuthentication,
        documentSignerCertBase64: payload.nfcChipData.passiveAuthentication
          .documentSignerCertBase64
          ? "[omitted]"
          : "",
      },
    },
    biometrics: {
      ...payload.biometrics,
      liveSelfieBase64: payload.biometrics.liveSelfieBase64
        ? `[omitted ${payload.biometrics.liveSelfieBase64.length} chars]`
        : "",
    },
  };
}

export async function submitGhanaCardVerification(
  userId: string,
  payload: GhanaCardVerificationPayload
) {
  const existing = await prisma.verificationSession.findUnique({
    where: { sessionId: payload.sessionId },
  });
  if (existing) {
    return {
      error: "Session already submitted" as const,
      status: null,
      overallResult: existing.overallResult,
      checks: existing.checks as VerificationChecks,
    };
  }

  const nationalId = payload.nfcChipData.dg1PersonalDetails.nationalIdNumber;

  const taken = await prisma.user.findFirst({
    where: {
      ghanaCardNumber: nationalId,
      NOT: { id: userId },
    },
    select: { id: true },
  });
  if (taken) {
    return {
      error: "This Ghana Card is already linked to another account" as const,
      status: null,
      overallResult: null,
      checks: null,
    };
  }

  const { checks, overallResult } = await scoreVerification(payload);
  const userStatus = overallToUserStatus(overallResult);
  const sanitized = sanitizeVerificationPayload(payload);

  const session = await prisma.$transaction(async (tx) => {
    const row = await tx.verificationSession.create({
      data: {
        userId,
        sessionId: payload.sessionId,
        overallResult,
        checks,
        mrzDocumentNumber: payload.mrzData.documentNumber,
        nationalIdNumber: nationalId,
        faceMatchScore: payload.biometrics.faceMatchScore,
        livenessPassed: payload.biometrics.livenessPassed,
        payload: sanitized,
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        idVerificationStatus: userStatus,
        ...(overallResult === "PASSED"
          ? { ghanaCardNumber: nationalId }
          : {}),
      },
    });

    return row;
  });

  return {
    error: null,
    status: userStatus,
    overallResult,
    checks,
    sessionId: session.sessionId,
    nationalIdNumber: nationalId,
  };
}

export async function getVerificationStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      idVerificationStatus: true,
      ghanaCardNumber: true,
      fullName: true,
    },
  });
  if (!user) return null;

  const latest = await prisma.verificationSession.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      sessionId: true,
      overallResult: true,
      checks: true,
      nationalIdNumber: true,
      faceMatchScore: true,
      createdAt: true,
    },
  });

  return {
    id_verification_status: user.idVerificationStatus,
    ghana_card_number: user.ghanaCardNumber,
    latest_session: latest
      ? {
          session_id: latest.sessionId,
          overall_result: latest.overallResult,
          checks: latest.checks,
          national_id_number: latest.nationalIdNumber,
          face_match_score: latest.faceMatchScore,
          created_at: latest.createdAt.toISOString(),
        }
      : null,
  };
}
