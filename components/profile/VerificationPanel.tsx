"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, IdCard, Loader2, ShieldCheck, ShieldQuestion } from "lucide-react";
import { toast } from "sonner";
import {
  fetchMyVerification,
  submitVerification,
  uploadVerificationImage,
} from "@/lib/api-client";
import type { MyVerificationStatus, VerificationDocumentType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const DOCUMENT_OPTIONS: { value: VerificationDocumentType; label: string }[] = [
  { value: "ghana_card", label: "Ghana Card" },
  { value: "passport", label: "Passport" },
  { value: "drivers_license", label: "Driver's License" },
];

export function VerificationPanel() {
  const [status, setStatus] = useState<MyVerificationStatus | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [documentType, setDocumentType] = useState<VerificationDocumentType>(
    "ghana_card"
  );
  const [idNumber, setIdNumber] = useState("");
  const [idPhotoFile, setIdPhotoFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const idPhotoInput = useRef<HTMLInputElement>(null);
  const selfieInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMyVerification()
      .then(setStatus)
      .catch(() => {});
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!idNumber.trim()) {
      toast.error("Enter your ID number");
      return;
    }
    if (!idPhotoFile || !selfieFile) {
      toast.error("Add a photo of your ID and a selfie");
      return;
    }
    setSubmitting(true);
    try {
      const [idPhotoUrl, selfieUrl] = await Promise.all([
        uploadVerificationImage(idPhotoFile),
        uploadVerificationImage(selfieFile),
      ]);
      const updated = await submitVerification({
        documentType,
        idNumber: idNumber.trim(),
        idPhotoUrl,
        selfieUrl,
      });
      setStatus(updated);
      setFormOpen(false);
      setIdNumber("");
      setIdPhotoFile(null);
      setSelfieFile(null);
      toast.success("Submitted — we'll review it and update your badge soon");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not submit your verification"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!status) {
    return (
      <div className="rounded-2xl border border-border bg-white p-5">
        <p className="text-sm text-muted-foreground">Loading verification status…</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-start gap-3">
        {status.status === "verified" ? (
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-verified" />
        ) : (
          <ShieldQuestion className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {status.status === "verified" && "You're verified"}
            {status.status === "pending" && "Verification in review"}
            {status.status === "rejected" && "Verification needs another try"}
            {status.status === "unverified" && "Get verified"}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {status.status === "verified" &&
              "Your badge shows up on your listings and in chat, so landlords and renters know you're a real, findable person."}
            {status.status === "pending" &&
              "We usually review submissions within a day. You'll see a checkmark badge once it's approved."}
            {status.status === "rejected" &&
              (status.latest_request?.reviewer_notes ||
                "The last submission couldn't be confirmed. Please try again with a clearer photo.")}
            {status.status === "unverified" &&
              "Landlords: use Ghana Card chip NFC in the Android app (/verify). Or upload a photo of your ID + selfie here for admin review."}
          </p>
        </div>
      </div>

      {(status.status === "unverified" || status.status === "rejected") && (
        <div className="mt-4">
          {!formOpen ? (
            <div className="flex flex-wrap gap-2">
              <a
                href="/verify"
                className="inline-flex h-7 items-center rounded-full bg-primary px-2.5 text-[0.8rem] font-medium text-primary-foreground"
              >
                Chip NFC (Android)
              </a>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => setFormOpen(true)}
              >
                Photo upload (manual review)
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label>Document type</Label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {DOCUMENT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDocumentType(opt.value)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium",
                        documentType === opt.value
                          ? "border-primary bg-accent text-primary"
                          : "border-border bg-white text-foreground"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="id-number">ID number</Label>
                <Input
                  id="id-number"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="GHA-000000000-0"
                  className="mt-1.5 h-11"
                  maxLength={30}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <CaptureTile
                  label="Photo of ID"
                  icon={<IdCard className="size-5" />}
                  file={idPhotoFile}
                  inputRef={idPhotoInput}
                  capture="environment"
                  onSelect={setIdPhotoFile}
                />
                <CaptureTile
                  label="Selfie"
                  icon={<Camera className="size-5" />}
                  file={selfieFile}
                  inputRef={selfieInput}
                  capture="user"
                  onSelect={setSelfieFile}
                />
              </div>

              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Only our review team can see these photos — they&apos;re never shown
                publicly or shared with other users.
              </p>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-full"
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="size-3.5 animate-spin" />}
                  Submit for review
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setFormOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function CaptureTile({
  label,
  icon,
  file,
  inputRef,
  capture,
  onSelect,
}: {
  label: string;
  icon: React.ReactNode;
  file: File | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  capture: "environment" | "user";
  onSelect: (file: File) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex h-24 flex-col items-center justify-center gap-1.5 rounded-xl border text-xs font-medium",
        file
          ? "border-primary bg-accent text-primary"
          : "border-dashed border-border text-muted-foreground"
      )}
    >
      {icon}
      <span className="max-w-[90%] truncate px-1">
        {file ? file.name : label}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture={capture}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSelect(f);
        }}
      />
    </button>
  );
}
