import type {
  AdminVerificationRequest,
  ChatMessageDto,
  ChatThreadHeader,
  ChatThreadSummary,
  MyVerificationStatus,
  NeighborhoodInsightSummary,
  Property as AppProperty,
  FilterChip,
  ReportReason,
  TrustScoreSummary,
  VerificationDocumentType,
} from "@/lib/types";

export async function fetchProperties(params?: {
  q?: string;
  filter?: FilterChip;
  furnishing?: string;
  minBeds?: string;
  availableBy?: string;
  billsIncluded?: boolean;
}): Promise<AppProperty[]> {
  const search = new URLSearchParams();
  if (params?.q) search.set("q", params.q);
  if (params?.filter === "verified") search.set("verified", "true");
  else if (params?.filter && params.filter !== "all") {
    search.set("type", params.filter);
  }
  if (params?.furnishing) search.set("furnishing", params.furnishing);
  if (params?.minBeds) search.set("min_beds", params.minBeds);
  if (params?.availableBy) search.set("available_by", params.availableBy);
  if (params?.billsIncluded) search.set("bills_included", "true");
  const qs = search.toString();
  const res = await fetch(`/api/v1/properties${qs ? `?${qs}` : ""}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load properties");
  const data = await res.json();
  return data.properties as AppProperty[];
}

export async function fetchProperty(id: string): Promise<AppProperty | null> {
  const res = await fetch(`/api/v1/properties/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load property");
  const data = await res.json();
  return data.property as AppProperty;
}

export async function fetchFavorites(): Promise<{
  properties: AppProperty[];
  ids: string[];
}> {
  const res = await fetch("/api/v1/favorites", { cache: "no-store" });
  if (res.status === 401) return { properties: [], ids: [] };
  if (!res.ok) throw new Error("Failed to load favorites");
  return res.json();
}

export async function toggleFavoriteApi(
  propertyId: string,
  currentlyFavorited: boolean
): Promise<boolean> {
  const res = await fetch(`/api/v1/favorites/${propertyId}`, {
    method: currentlyFavorited ? "DELETE" : "POST",
  });
  if (res.status === 401) {
    throw new Error("AUTH_REQUIRED");
  }
  if (!res.ok) throw new Error("Favorite update failed");
  const data = await res.json();
  return Boolean(data.favorited);
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export async function fetchChatThreads(): Promise<ChatThreadSummary[]> {
  const res = await fetch("/api/v1/chat/threads", { cache: "no-store" });
  if (res.status === 401) return [];
  if (!res.ok) throw new Error("Failed to load conversations");
  const data = await res.json();
  return data.threads as ChatThreadSummary[];
}

export async function startOrOpenThread(
  propertyId: string,
  message?: string
): Promise<string> {
  const res = await fetch("/api/v1/chat/threads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ propertyId, message }),
  });
  if (res.status === 401) throw new Error("AUTH_REQUIRED");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (data.code === "KYC_REQUIRED") throw new Error("KYC_REQUIRED");
    throw new Error(data.error ?? "Could not start conversation");
  }
  const data = await res.json();
  return data.threadId as string;
}

export async function fetchThreadMessages(threadId: string): Promise<{
  thread: ChatThreadHeader;
  messages: ChatMessageDto[];
}> {
  const res = await fetch(`/api/v1/chat/threads/${threadId}/messages`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load conversation");
  return res.json();
}

export async function sendChatMessage(
  threadId: string,
  body: string
): Promise<ChatMessageDto> {
  const res = await fetch(`/api/v1/chat/threads/${threadId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) throw new Error("Message failed to send");
  const data = await res.json();
  return data.message as ChatMessageDto;
}

// ---------------------------------------------------------------------------
// Listing reports
// ---------------------------------------------------------------------------

export async function reportListing(
  propertyId: string,
  reason: ReportReason,
  details?: string
): Promise<void> {
  const res = await fetch(`/api/v1/properties/${propertyId}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason, details }),
  });
  if (res.status === 401) throw new Error("AUTH_REQUIRED");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (data.code === "KYC_REQUIRED") throw new Error("KYC_REQUIRED");
    throw new Error(data.error ?? "Could not submit report");
  }
}

// ---------------------------------------------------------------------------
// Neighborhood insights
// ---------------------------------------------------------------------------

export async function fetchNeighborhoodInsights(
  neighborhood: string,
  cityTown: string
): Promise<NeighborhoodInsightSummary> {
  const search = new URLSearchParams({ neighborhood, cityTown });
  const res = await fetch(`/api/v1/insights?${search.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load neighborhood insights");
  const data = await res.json();
  return data.summary as NeighborhoodInsightSummary;
}

export async function submitInsight(input: {
  neighborhood: string;
  cityTown: string;
  powerRating: number;
  waterRating: number;
  safetyRating: number;
  comment?: string;
}): Promise<NeighborhoodInsightSummary> {
  const res = await fetch("/api/v1/insights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (res.status === 401) throw new Error("AUTH_REQUIRED");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (data.code === "KYC_REQUIRED") throw new Error("KYC_REQUIRED");
    throw new Error(data.error ?? "Could not submit your rating");
  }
  const data = await res.json();
  return data.summary as NeighborhoodInsightSummary;
}

// ---------------------------------------------------------------------------
// Identity verification (manual upload + admin review)
// ---------------------------------------------------------------------------

export async function fetchMyVerification(): Promise<MyVerificationStatus> {
  const res = await fetch("/api/v1/verification", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load verification status");
  return res.json();
}

export async function uploadVerificationImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/v1/verification/upload", {
    method: "POST",
    body: form,
  });
  if (res.status === 401) throw new Error("AUTH_REQUIRED");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Upload failed");
  }
  const data = await res.json();
  return data.url as string;
}

export async function submitVerification(input: {
  documentType: VerificationDocumentType;
  idNumber: string;
  idPhotoUrl: string;
  selfieUrl: string;
}): Promise<MyVerificationStatus> {
  const res = await fetch("/api/v1/verification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (res.status === 401) throw new Error("AUTH_REQUIRED");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Could not submit your verification");
  }
  return res.json();
}

export async function fetchPendingVerifications(): Promise<
  AdminVerificationRequest[]
> {
  const res = await fetch("/api/v1/admin/verifications", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load verification queue");
  const data = await res.json();
  return data.requests as AdminVerificationRequest[];
}

export async function reviewVerificationRequest(
  requestId: string,
  decision: "verified" | "rejected",
  reviewerNotes?: string
): Promise<void> {
  const res = await fetch(`/api/v1/admin/verifications/${requestId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision, reviewerNotes }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Could not save decision");
  }
}

export async function fetchUserTrustScore(
  userId: string
): Promise<TrustScoreSummary | null> {
  const res = await fetch(`/api/v1/users/${userId}/trust`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load trust score");
  const data = await res.json();
  return data.summary as TrustScoreSummary;
}

export async function submitThreadReview(
  threadId: string,
  rating: number,
  comment?: string
): Promise<void> {
  const res = await fetch(`/api/v1/chat/threads/${threadId}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rating, comment }),
  });
  if (res.status === 401) throw new Error("AUTH_REQUIRED");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Could not submit review");
  }
}
