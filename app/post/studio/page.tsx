import type { Metadata } from "next";
import { ListingStudio } from "@/components/studio/ListingStudio";

export const metadata: Metadata = {
  title: "Listing Studio — Ashesi Pa",
  description:
    "Drag and drop bedrooms, bathrooms, parking and more to build a listing card, add photos and publish.",
};

export default function ListingStudioPage() {
  return (
    <main>
      <ListingStudio />
    </main>
  );
}
