import { ListingDesk } from "@/components/mine/ListingDesk";

export default function MyListingsPage() {
  return (
    <main>
      <div className="px-4 pt-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-brand">My listings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit a home, pause it, mark it rented, and answer viewing and rental requests.
        </p>
      </div>
      <ListingDesk />
    </main>
  );
}
