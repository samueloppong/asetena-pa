import type { GhanaCardVerificationPayload } from "@/lib/validations";
import type { VerificationStatus } from "@/lib/types";

export async function fetchVerifyStatus(): Promise<{
  id_verification_status: VerificationStatus;
  ghana_card_number: string | null;
  latest_session: {
    session_id: string;
    overall_result: string;
    checks: unknown;
    national_id_number: string | null;
    face_match_score: number | null;
    created_at: string;
  } | null;
}> {
  const res = await fetch("/api/v1/verify/status", { cache: "no-store" });
  if (res.status === 401) throw new Error("AUTH_REQUIRED");
  if (!res.ok) throw new Error("Could not load verification status");
  return res.json();
}

export async function submitGhanaCardVerification(
  payload: GhanaCardVerificationPayload
): Promise<{
  overall_result: string;
  checks: {
    mrzMatch: boolean;
    chipAuthentic: boolean;
    faceMatch: boolean;
    niaLookupMatch: boolean;
  };
  id_verification_status: VerificationStatus;
  national_id_number?: string;
  session_id?: string;
}> {
  const res = await fetch("/api/v1/verify/ghana-card", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.status === 401) throw new Error("AUTH_REQUIRED");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? "Verification failed");
  }
  return data;
}

export function isKycRequiredError(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.message === "KYC_REQUIRED" ||
      err.message.toLowerCase().includes("ghana card verification"))
  );
}

/** Parse API JSON error for KYC gate. */
export async function throwIfKyc(res: Response) {
  if (res.status !== 403) return;
  const data = await res.json().catch(() => ({}));
  if (data.code === "KYC_REQUIRED") {
    throw new Error("KYC_REQUIRED");
  }
}
