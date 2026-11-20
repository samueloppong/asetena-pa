import { RentalDesk } from "@/components/rentals/RentalDesk";

export default function RentalsPage() {
  return (
    <main>
      <div className="px-4 pt-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-brand">My requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Viewings and rental applications you have sent.
        </p>
      </div>
      <RentalDesk />
    </main>
  );
}
