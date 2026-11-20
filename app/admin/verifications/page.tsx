import { VerificationQueue } from "@/components/admin/VerificationQueue";

export default function AdminVerificationsPage() {
  return (
    <main className="min-h-[70vh] pb-20">
      <div className="sticky top-0 z-10 border-b border-border/80 bg-white/90 px-4 py-4 backdrop-blur-xl">
        <h1 className="text-xl font-extrabold tracking-tight text-brand">
          Verification queue
        </h1>
        <p className="text-xs text-muted-foreground">
          Review Ghana Card, passport and driver&apos;s license submissions
        </p>
      </div>
      <VerificationQueue />
    </main>
  );
}
