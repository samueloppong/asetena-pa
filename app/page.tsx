import { Suspense } from "react";
import { ExploreClient } from "@/components/explore/ExploreClient";
import { listExperiences } from "@/lib/experiences";
import { listPropertiesFromDb } from "@/lib/properties";
import type { Experience } from "@/lib/experience-types";
import type { Property } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  let initialProperties: Property[] = [];
  let initialExperiences: Experience[] = [];
  try {
    [initialProperties, initialExperiences] = await Promise.all([
      listPropertiesFromDb(),
      listExperiences({ limit: 12 }),
    ]);
  } catch (error) {
    console.error("Failed to load explore data", error);
  }

  return (
    <Suspense
      fallback={
        <div className="px-4 py-20 text-center text-sm text-muted-foreground">
          Loading homes…
        </div>
      }
    >
      <ExploreClient
        initialProperties={initialProperties}
        initialExperiences={initialExperiences}
      />
    </Suspense>
  );
}
