"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock } from "lucide-react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type RegisterRole = "renter" | "landlord" | "agent" | "firm";

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<RegisterRole>("renter");
  const [form, setForm] = useState({
    fullName: "",
    companyName: "",
    registrationNumber: "",
    email: "",
    phoneNumber: "",
    password: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (role === "firm" && form.companyName.trim().length < 2) {
      toast.error("Enter your firm or building society name");
      return;
    }
    if (
      (role === "agent" || role === "firm") &&
      form.registrationNumber.trim().length < 3
    ) {
      toast.error(`Enter your ${role} registration number`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          companyName: role === "firm" ? form.companyName.trim() : null,
          registrationNumber:
            role === "agent" || role === "firm"
              ? form.registrationNumber.trim()
              : null,
          role,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Registration failed");
        setLoading(false);
        return;
      }
      const login = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (login?.error) {
        toast.success("Account created — please sign in");
        router.push("/login");
      } else {
        toast.success("Welcome to Ashesi Pa");
        router.push("/");
        router.refresh();
      }
    } catch {
      toast.error("Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-4 px-4 py-8">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(
          [
            ["renter", "Renter"],
            ["landlord", "Landlord"],
            ["agent", "Agent"],
            ["firm", "Firm"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setRole(value)}
            className={cn(
              "rounded-xl border px-2 py-2.5 text-sm font-medium",
              role === value
                ? "border-primary bg-accent text-foreground"
                : "border-border bg-white"
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Landlords, agents, and firms list homes with lettings accountability.
        Renters search, apply, and rent.
      </p>

      <div className="space-y-2">
        <Label htmlFor="fullName">
          {role === "firm" ? "Authorised contact name" : "Full name"}
        </Label>
        <Input
          id="fullName"
          required
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          className="h-11 rounded-xl"
        />
      </div>
      {role === "firm" && (
        <div className="space-y-2">
          <Label htmlFor="companyName">Firm / building society name</Label>
          <Input
            id="companyName"
            required
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            placeholder="e.g. Accra Homes Ltd"
            className="h-11 rounded-xl"
          />
        </div>
      )}
      {(role === "agent" || role === "firm") && (
        <div className="space-y-2">
          <Label htmlFor="registrationNumber">
            {role === "firm" ? "Firm registration number" : "Agent registration number"}
          </Label>
          <Input
            id="registrationNumber"
            required
            minLength={3}
            maxLength={60}
            value={form.registrationNumber}
            onChange={(e) =>
              setForm({ ...form, registrationNumber: e.target.value })
            }
            placeholder={role === "firm" ? "e.g. CS123456789" : "e.g. your agency or licence number"}
            className="h-11 rounded-xl"
          />
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Lock className="mt-0.5 size-3 shrink-0" />
            Kept private — only our team can see it. It is never shown on your
            listings or profile.
          </p>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="h-11 rounded-xl"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone (Ghana)</Label>
        <Input
          id="phone"
          required
          placeholder="+233…"
          value={form.phoneNumber}
          onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
          className="h-11 rounded-xl"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          required
          minLength={8}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="h-11 rounded-xl"
        />
      </div>
      <Button type="submit" className="h-11 w-full rounded-xl" disabled={loading}>
        {loading ? "Creating…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary">
          Sign in
        </Link>
      </p>
    </form>
  );
}
