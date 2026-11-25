"use client";

import { useCallback, useReducer } from "react";
import {
  FEATURE_BY_KEY,
  FEATURE_KEYS,
  type FeatureKey,
  type ListingFeatures,
} from "@/lib/listing-features";
import type {
  Furnishing,
  PaymentFrequency,
  PropertyAmenities,
  PropertyType,
  RoomCategory,
  StayDuration,
} from "@/lib/types";

/** MIME type used while dragging a component tile onto the canvas. */
export const FEATURE_MIME = "application/x-ashesi-feature";

export const STUDIO_STORAGE_KEY = "ashesi-pa:studio-draft:v1";
export const MAX_PHOTOS = 20;

export type StudioPhoto = {
  id: string;
  /** Stored media URL returned by the upload API. */
  url: string;
  category: RoomCategory;
};

/** The parts of the draft that undo/redo cover: what is on the canvas. */
export type CanvasState = {
  features: ListingFeatures;
  photos: StudioPhoto[];
};

export interface StudioDetails {
  title: string;
  description: string;
  propertyType: PropertyType;
  stayDuration: StayDuration;
  region: string;
  city: string;
  neighborhood: string;
  digitalAddress: string;
  price: string;
  advance: PaymentFrequency;
  depositMonths: string;
  furnishing: Furnishing;
  availableFrom: string;
  billsIncluded: boolean;
  /** Empty string = work it out from the bedroom count. */
  maxOccupants: string;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  amenities: PropertyAmenities;
}

export const defaultDetails: StudioDetails = {
  title: "",
  description: "",
  propertyType: "apartment",
  stayDuration: "long_stay",
  region: "Greater Accra",
  city: "Accra",
  neighborhood: "",
  digitalAddress: "",
  price: "",
  advance: "six_months",
  depositMonths: "1",
  furnishing: "unfurnished",
  availableFrom: "",
  billsIncluded: false,
  maxOccupants: "",
  petsAllowed: false,
  smokingAllowed: false,
  amenities: {
    has_polytank_water: true,
    has_standby_generator: false,
    has_solar: false,
    has_air_conditioning: false,
    is_walled_and_gated: true,
    has_self_meter: true,
    has_parking_space: false,
  },
};

export const defaultCanvas: CanvasState = {
  features: { bedroom: 1, bathroom: 1 },
  photos: [],
};

type StoredDraft = {
  details: StudioDetails;
  canvas: CanvasState;
  savedAt: number;
};

export function loadStoredDraft(): StoredDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STUDIO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredDraft>;
    if (!parsed.details || !parsed.canvas) return null;
    const features: ListingFeatures = {};
    for (const key of FEATURE_KEYS) {
      const n = parsed.canvas.features?.[key];
      if (typeof n === "number" && n > 0) {
        features[key] = Math.min(n, FEATURE_BY_KEY[key].max);
      }
    }
    return {
      details: {
        ...defaultDetails,
        ...parsed.details,
        amenities: { ...defaultDetails.amenities, ...parsed.details.amenities },
      },
      canvas: {
        features,
        photos: Array.isArray(parsed.canvas.photos)
          ? parsed.canvas.photos.filter(
              (p): p is StudioPhoto =>
                Boolean(p) &&
                typeof p.url === "string" &&
                typeof p.id === "string",
            )
          : [],
      },
      savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function saveDraft(details: StudioDetails, canvas: CanvasState): number {
  const savedAt = Date.now();
  try {
    const payload: StoredDraft = { details, canvas, savedAt };
    window.localStorage.setItem(STUDIO_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Storage full or blocked (private mode) — the draft simply isn't kept.
  }
  return savedAt;
}

export function clearStoredDraft() {
  try {
    window.localStorage.removeItem(STUDIO_STORAGE_KEY);
  } catch {
    // ignore
  }
}

type History = {
  past: CanvasState[];
  present: CanvasState;
  future: CanvasState[];
};

type HistoryAction =
  | { type: "commit"; update: (prev: CanvasState) => CanvasState }
  | { type: "undo" }
  | { type: "redo" };

const HISTORY_LIMIT = 50;

function historyReducer(state: History, action: HistoryAction): History {
  switch (action.type) {
    case "commit": {
      const next = action.update(state.present);
      if (next === state.present) return state;
      return {
        past: [...state.past, state.present].slice(-HISTORY_LIMIT),
        present: next,
        future: [],
      };
    }
    case "undo": {
      const previous = state.past[state.past.length - 1];
      if (!previous) return state;
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
      };
    }
    case "redo": {
      const [next, ...rest] = state.future;
      if (!next) return state;
      return {
        past: [...state.past, state.present],
        present: next,
        future: rest,
      };
    }
  }
}

/** Canvas contents (components + photos) with undo / redo. */
export function useCanvasHistory(initial: CanvasState) {
  const [history, dispatch] = useReducer(historyReducer, {
    past: [],
    present: initial,
    future: [],
  });

  const commit = useCallback(
    (update: (prev: CanvasState) => CanvasState) =>
      dispatch({ type: "commit", update }),
    [],
  );
  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);

  return {
    canvas: history.present,
    commit,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}

/** Pure helpers that produce the next canvas state. */
export function withFeatureAdded(
  canvas: CanvasState,
  key: FeatureKey,
): CanvasState {
  const def = FEATURE_BY_KEY[key];
  const current = canvas.features[key] ?? 0;
  const next = def.countable ? Math.min(current + 1, def.max) : 1;
  if (next === current) return canvas;
  return { ...canvas, features: { ...canvas.features, [key]: next } };
}

export function withFeatureStepped(
  canvas: CanvasState,
  key: FeatureKey,
  delta: 1 | -1,
): CanvasState {
  const def = FEATURE_BY_KEY[key];
  const current = canvas.features[key] ?? 0;
  const next = Math.min(Math.max(current + delta, 0), def.max);
  if (next === current) return canvas;
  const features = { ...canvas.features };
  if (next === 0) delete features[key];
  else features[key] = next;
  return { ...canvas, features };
}

export function withFeatureRemoved(
  canvas: CanvasState,
  key: FeatureKey,
): CanvasState {
  if (!(key in canvas.features)) return canvas;
  const features = { ...canvas.features };
  delete features[key];
  return { ...canvas, features };
}
