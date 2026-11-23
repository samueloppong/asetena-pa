import { VerifyWizard } from "@/components/verify/VerifyWizard";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function VerifyPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/verify");
  }

  return (
    <main className="px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-[-0.03em] text-brand">
        Ghana Card chip verification
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        UK GOV-style NFC ID check — read the National ID chip on Android, then
        match a live selfie. Required before landlords list homes.
      </p>
      <div className="mt-6">
        <VerifyWizard />
      </div>
    </main>
  );
}
