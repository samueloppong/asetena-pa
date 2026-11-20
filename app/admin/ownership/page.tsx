import { OwnershipQueue } from "@/components/admin/OwnershipQueue";

export default function AdminOwnershipPage() {
  return (
    <main>
      <div className="px-4 pt-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-brand">Ownership claims</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Approve a land title or indenture before a listing can wear the owner badge.
        </p>
      </div>
      <OwnershipQueue />
    </main>
  );
}