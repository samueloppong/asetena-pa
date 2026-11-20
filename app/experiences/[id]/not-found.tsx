import Link from "next/link";

export default function ExperienceNotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-extrabold text-brand">Experience not found</h1>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
      >
        Back to Explore
      </Link>
    </main>
  );
}
