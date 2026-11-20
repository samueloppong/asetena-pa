/** Live "people watching" presence for listing detail pages. */

const HEARTBEAT_TTL_MS = 45_000;

type ViewerMap = Map<string, number>;

const globalStore = globalThis as unknown as {
  listingViewers?: Map<string, ViewerMap>;
};

function store(): Map<string, ViewerMap> {
  if (!globalStore.listingViewers) {
    globalStore.listingViewers = new Map();
  }
  return globalStore.listingViewers;
}

function prune(propertyId: string, now = Date.now()): ViewerMap {
  const viewers = store().get(propertyId);
  if (!viewers) return new Map();

  for (const [viewerId, lastSeen] of viewers) {
    if (now - lastSeen > HEARTBEAT_TTL_MS) {
      viewers.delete(viewerId);
    }
  }

  if (viewers.size === 0) {
    store().delete(propertyId);
    return new Map();
  }

  return viewers;
}

export function touchListingViewer(propertyId: string, viewerId: string): number {
  const now = Date.now();
  const viewers = prune(propertyId, now);
  const next = viewers.size > 0 ? viewers : new Map<string, number>();
  next.set(viewerId, now);
  store().set(propertyId, next);
  return next.size;
}

export function leaveListingViewer(propertyId: string, viewerId: string): number {
  const viewers = prune(propertyId);
  viewers.delete(viewerId);
  if (viewers.size === 0) {
    store().delete(propertyId);
    return 0;
  }
  store().set(propertyId, viewers);
  return viewers.size;
}

export function countListingViewers(propertyId: string): number {
  return prune(propertyId).size;
}

export const LISTING_VIEWER_TTL_MS = HEARTBEAT_TTL_MS;
