import Link from "next/link";

export default function PropertyNotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-extrabold text-brand">Home not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This listing may have been removed or the link is incorrect.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
      >
        Back to Explore
      </Link>
    </main>
  );
}
