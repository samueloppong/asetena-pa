"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Lets agents and firms record (or correct) their registration number. Private to us. */
export function RegistrationNumberCard({ role }: { role: "agent" | "firm" }) {
  const [saved, setSaved] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const noun = role === "firm" ? "Firm" : "Agent";

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/me/registration-number")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setSaved(data.registration_number ?? null);
        setValue(data.registration_number ?? "");
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/v1/me/registration-number", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationNumber: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not save registration number");
        return;
      }
      setSaved(data.registration_number);
      setValue(data.registration_number ?? "");
      toast.success("Registration number saved");
    } catch {
      toast.error("Could not save registration number");
    } finally {
      setSaving(false);
    }
  }

  const dirty = value.trim() !== (saved ?? "");

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-white p-5">
      <div>
        <h2 className="text-sm font-bold text-brand">{noun} registration number</h2>
        <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
          <Lock className="mt-0.5 size-3 shrink-0" />
          Kept private — only our team can see it. It is never shown on your
          listings or profile.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="registration-number" className="sr-only">
          {noun} registration number
        </Label>
        <Input
          id="registration-number"
          value={value}
          disabled={!loaded}
          onChange={(e) => setValue(e.target.value)}
          maxLength={60}
          placeholder={saved ? "" : "e.g. CS123456789"}
          className="h-11 rounded-xl"
        />
        {loaded && !saved && (
          <p className="text-xs font-medium text-amber-700">
            Not recorded yet — please add it.
          </p>
        )}
      </div>
      <Button
        type="button"
        className="h-11 w-full rounded-xl"
        disabled={!loaded || saving || !dirty || value.trim().length < 3}
        onClick={save}
      >
        {saving ? "Saving…" : saved ? "Update registration number" : "Save registration number"}
      </Button>
    </section>
  );
}
