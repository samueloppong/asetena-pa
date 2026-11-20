import { ReportQueue } from "@/components/admin/ReportQueue";

export default function AdminReportsPage() {
  return (
    <main>
      <div className="px-4 pt-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-brand">Listing reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          One report per person. Three open reports hide a listing until you dismiss them or put it back.
        </p>
      </div>
      <ReportQueue />
    </main>
  );
}
