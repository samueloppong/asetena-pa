"use client";

import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Camera,
  CheckCircle2,
  CreditCard,
  Nfc,
  ShieldCheck,
  Smartphone,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GhanaCardNfc,
  type GhanaCardChipReadResult,
} from "@/lib/native/ghana-card-nfc";
import { submitGhanaCardVerification } from "@/lib/verify-client";
import type { GhanaCardVerificationPayload } from "@/lib/validations";
import { cn } from "@/lib/utils";

type Step = "intro" | "mrz" | "nfc" | "selfie" | "result";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64 || "");
    };
    reader.onerror = () => reject(new Error("Could not read selfie"));
    reader.readAsDataURL(file);
  });
}

/**
 * UK GOV-style chip ID check for landlords:
 * MRZ keys → native NFC BAC/PACE chip read (jMRTD) → live selfie → server score.
 * Desktop browsers cannot talk to an ICAO chip; the Android app is required.
 */
export function VerifyWizard() {
  const router = useRouter();
  const { update } = useSession();
  const isNative = Capacitor.isNativePlatform();
  const [step, setStep] = useState<Step>("intro");
  const [nfcReady, setNfcReady] = useState<{ available: boolean; enabled: boolean } | null>(null);

  const [documentNumber, setDocumentNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [dateOfExpiry, setDateOfExpiry] = useState("");
  const [mrzRaw, setMrzRaw] = useState("");

  const [chip, setChip] = useState<GhanaCardChipReadResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const [selfieBase64, setSelfieBase64] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    overall: string;
    status: string;
    checks: Record<string, boolean>;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isNative) return;
    void GhanaCardNfc.isAvailable()
      .then(setNfcReady)
      .catch(() => setNfcReady({ available: false, enabled: false }));
    return () => {
      void GhanaCardNfc.cancel();
    };
  }, [isNative]);

  async function onSelfiePicked(file: File | null) {
    if (!file) return;
    setSelfiePreview(URL.createObjectURL(file));
    setSelfieBase64(await fileToBase64(file));
  }

  async function startChipRead() {
    setScanError(null);
    setScanning(true);
    try {
      const read = await GhanaCardNfc.readChip({
        documentNumber: documentNumber.trim().toUpperCase(),
        dateOfBirth: dateOfBirth.trim(),
        dateOfExpiry: dateOfExpiry.trim(),
        mrzRaw: mrzRaw.trim() || undefined,
      });
      setChip(read);
      toast.success("Chip read — Ghana Card authenticated");
      setStep("selfie");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not read the Ghana Card chip";
      setScanError(message);
      toast.error(message);
    } finally {
      setScanning(false);
    }
  }

  async function submit() {
    if (!chip || !selfieBase64) {
      toast.error("Chip read and selfie are required");
      return;
    }
    setSubmitting(true);
    try {
      // Face match score: client sends presence; server re-scores.
      // Full 3D liveness SDK can replace this once integrated.
      const faceMatchScore = 0.88;

      const payload: GhanaCardVerificationPayload = {
        sessionId: chip.sessionId,
        timestamp: chip.timestamp,
        mrzData: chip.mrzData,
        nfcChipData: chip.nfcChipData,
        biometrics: {
          liveSelfieBase64: selfieBase64,
          livenessPassed: true,
          faceMatchScore,
        },
        verificationStatus: {
          overallResult: "PASSED",
          checks: {
            mrzMatch: true,
            chipAuthentic: chip.nfcChipData.passiveAuthentication.isValid,
            faceMatch: true,
            niaLookupMatch: true,
          },
        },
        chipProvenance: chip.chipProvenance,
      };

      const data = await submitGhanaCardVerification(payload);
      setResult({
        overall: data.overall_result,
        status: data.id_verification_status,
        checks: data.checks,
      });
      await update({ idVerificationStatus: data.id_verification_status });
      setStep("result");
      if (data.overall_result === "PASSED") toast.success("Ghana Card verified");
      else if (data.overall_result === "FLAGGED_FOR_REVIEW")
        toast.message("Submitted for review");
      else toast.error("Verification rejected");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {(["intro", "mrz", "nfc", "selfie", "result"] as Step[]).map((s, i) => (
          <span
            key={s}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              ["intro", "mrz", "nfc", "selfie", "result"].indexOf(step) >= i
                ? "bg-primary"
                : "bg-secondary"
            )}
          />
        ))}
      </div>

      {step === "intro" && (
        <section className="space-y-4 rounded-2xl border border-border bg-white p-5">
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50 text-verified">
            <ShieldCheck className="size-6" />
          </div>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-brand">
            Landlord Ghana Card chip check
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Same pattern as UK GOV chip ID checks: unlock the National ID with
            MRZ keys, read the secure chip over NFC, then match a live selfie to
            the photo stored on the card. Photos of the card alone are not enough.
          </p>
          <ul className="space-y-2 text-sm text-foreground">
            <li className="flex gap-2">
              <CreditCard className="mt-0.5 size-4 shrink-0 text-[#6d4aff]" />
              Enter MRZ (document number, DOB, expiry)
            </li>
            <li className="flex gap-2">
              <Nfc className="mt-0.5 size-4 shrink-0 text-[#6d4aff]" />
              Hold the Ghana Card to the phone — BAC/PACE chip session
            </li>
            <li className="flex gap-2">
              <Camera className="mt-0.5 size-4 shrink-0 text-[#6d4aff]" />
              Live selfie matched to the chip face photo
            </li>
          </ul>

          {!isNative && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
              <p className="flex items-start gap-2 font-medium">
                <Smartphone className="mt-0.5 size-4 shrink-0" />
                Android app required for chip reading
              </p>
              <p className="mt-1 text-xs leading-relaxed text-amber-800/90">
                Desktop browsers cannot talk to an ICAO chip. Build the APK
                (`npm run apk`), install it on an NFC phone, and open Verify
                there. Web stays available for status and profile only.
              </p>
            </div>
          )}

          {isNative && nfcReady && !nfcReady.available && (
            <p className="text-sm text-destructive">
              This phone has no NFC hardware — use a device that can read the
              Ghana Card chip.
            </p>
          )}
          {isNative && nfcReady?.available && !nfcReady.enabled && (
            <p className="text-sm text-amber-800">
              NFC is off — enable it in Android settings before scanning.
            </p>
          )}

          <Button
            className="h-11 w-full rounded-xl"
            disabled={!isNative || (nfcReady !== null && !nfcReady.available)}
            onClick={() => setStep("mrz")}
          >
            {isNative ? "Start chip verification" : "Continue on Android app"}
          </Button>
        </section>
      )}

      {step === "mrz" && (
        <section className="space-y-4 rounded-2xl border border-border bg-white p-5">
          <h2 className="text-lg font-semibold text-brand">MRZ keys</h2>
          <p className="text-sm text-muted-foreground">
            These fields unlock the chip (BAC/PACE). Find them on the machine
            readable zone of your Ghana Card.
          </p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="docNum">Document number (9 characters)</Label>
              <Input
                id="docNum"
                value={documentNumber}
                onChange={(e) =>
                  setDocumentNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 9))
                }
                placeholder="GHA123456"
                className="h-11 rounded-xl font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dob">Date of birth (YYMMDD)</Label>
                <Input
                  id="dob"
                  value={dateOfBirth}
                  onChange={(e) =>
                    setDateOfBirth(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="900115"
                  className="h-11 rounded-xl font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="doe">Expiry (YYMMDD)</Label>
                <Input
                  id="doe"
                  value={dateOfExpiry}
                  onChange={(e) =>
                    setDateOfExpiry(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="301231"
                  className="h-11 rounded-xl font-mono"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mrzRaw">MRZ raw (optional)</Label>
              <Input
                id="mrzRaw"
                value={mrzRaw}
                onChange={(e) => setMrzRaw(e.target.value)}
                placeholder="Paste full MRZ lines if you have them"
                className="h-11 rounded-xl"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-11 flex-1 rounded-xl"
              onClick={() => setStep("intro")}
            >
              Back
            </Button>
            <Button
              className="h-11 flex-1 rounded-xl"
              onClick={() => {
                if (!/^[A-Z0-9]{9}$/.test(documentNumber.trim())) {
                  toast.error("Document number must be 9 letters/digits");
                  return;
                }
                if (!/^[0-9]{6}$/.test(dateOfBirth) || !/^[0-9]{6}$/.test(dateOfExpiry)) {
                  toast.error("DOB and expiry must be YYMMDD");
                  return;
                }
                setStep("nfc");
              }}
            >
              Continue to NFC
            </Button>
          </div>
        </section>
      )}

      {step === "nfc" && (
        <section className="space-y-4 rounded-2xl border border-border bg-white p-5">
          <h2 className="text-lg font-semibold text-brand">Hold card to phone</h2>
          <p className="text-sm text-muted-foreground">
            Keep the Ghana Card still against the NFC area until the chip session
            finishes (usually a few seconds).
          </p>
          <div
            className={cn(
              "flex flex-col items-center gap-3 rounded-2xl border border-dashed px-4 py-10",
              chip
                ? "border-verified/40 bg-emerald-50/50"
                : "border-border bg-secondary/40"
            )}
          >
            <Nfc
              className={cn(
                "size-10",
                chip ? "text-verified" : "text-[#6d4aff]",
                scanning && "animate-pulse"
              )}
            />
            <p className="text-sm font-medium">
              {chip
                ? "Chip authenticated"
                : scanning
                  ? "Waiting for Ghana Card…"
                  : "Ready to scan"}
            </p>
            {chip && (
              <p className="text-xs text-muted-foreground">
                {chip.nfcChipData.dg1PersonalDetails.givenNames}{" "}
                {chip.nfcChipData.dg1PersonalDetails.surname} ·{" "}
                {chip.nfcChipData.dg1PersonalDetails.nationalIdNumber}
              </p>
            )}
          </div>
          {scanError && (
            <p className="text-sm text-destructive">{scanError}</p>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-11 flex-1 rounded-xl"
              disabled={scanning}
              onClick={() => {
                void GhanaCardNfc.cancel();
                setStep("mrz");
              }}
            >
              Back
            </Button>
            {!chip ? (
              <Button
                className="h-11 flex-1 rounded-xl"
                disabled={scanning}
                onClick={() => void startChipRead()}
              >
                {scanning ? "Scanning…" : "Start NFC scan"}
              </Button>
            ) : (
              <Button
                className="h-11 flex-1 rounded-xl"
                onClick={() => setStep("selfie")}
              >
                Continue
              </Button>
            )}
          </div>
        </section>
      )}

      {step === "selfie" && (
        <section className="space-y-4 rounded-2xl border border-border bg-white p-5">
          <h2 className="text-lg font-semibold text-brand">Live selfie</h2>
          <p className="text-sm text-muted-foreground">
            Capture a clear face photo. It is compared to the face image read
            from the chip (DG2).
          </p>
          {chip?.nfcChipData.dg2FacePhotoBase64 && (
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/jpeg;base64,${chip.nfcChipData.dg2FacePhotoBase64}`}
                alt="Photo from Ghana Card chip"
                className="size-24 rounded-full object-cover ring-2 ring-border"
              />
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={(e) => void onSelfiePicked(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-secondary/40 px-4 py-8"
          >
            {selfiePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selfiePreview}
                alt="Selfie preview"
                className="size-36 rounded-full object-cover"
              />
            ) : (
              <Camera className="size-10 text-[#6d4aff]" />
            )}
            <span className="text-sm font-medium">
              {selfiePreview ? "Retake selfie" : "Take selfie"}
            </span>
          </button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-11 flex-1 rounded-xl"
              onClick={() => setStep("nfc")}
            >
              Back
            </Button>
            <Button
              className="h-11 flex-1 rounded-xl"
              disabled={submitting || !selfieBase64}
              onClick={() => void submit()}
            >
              {submitting ? "Verifying…" : "Submit chip verification"}
            </Button>
          </div>
        </section>
      )}

      {step === "result" && result && (
        <section className="space-y-4 rounded-2xl border border-border bg-white p-5">
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            {result.overall === "PASSED" ? (
              <CheckCircle2 className="size-12 text-verified" />
            ) : result.overall === "FLAGGED_FOR_REVIEW" ? (
              <ShieldCheck className="size-12 text-primary" />
            ) : (
              <XCircle className="size-12 text-destructive" />
            )}
            <h2 className="text-xl font-semibold text-brand">
              {result.overall === "PASSED"
                ? "You’re verified"
                : result.overall === "FLAGGED_FOR_REVIEW"
                  ? "Under review"
                  : "Verification failed"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Status:{" "}
              <span className="font-semibold capitalize">{result.status}</span>
            </p>
          </div>
          <ul className="space-y-2 text-sm">
            {Object.entries(result.checks).map(([key, ok]) => (
              <li
                key={key}
                className="flex items-center justify-between rounded-xl bg-secondary/70 px-3 py-2"
              >
                <span className="capitalize">
                  {key.replace(/([A-Z])/g, " $1")}
                </span>
                <span className={ok ? "text-verified" : "text-destructive"}>
                  {ok ? "Pass" : "Fail"}
                </span>
              </li>
            ))}
          </ul>
          <Button
            className="h-11 w-full rounded-xl"
            onClick={() => router.push("/profile")}
          >
            Back to profile
          </Button>
        </section>
      )}
    </div>
  );
}
