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
    <ExploreClient
      initialProperties={initialProperties}
      initialExperiences={initialExperiences}
    />
  );
}
