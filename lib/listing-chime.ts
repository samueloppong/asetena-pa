/**
 * UberEats-style short alert chime via Web Audio (no asset file required).
 * Browsers may require a prior user gesture before audio can play; we unlock
 * on first pointer/keydown and queue silently until then.
 */
let unlocked = false;
let pendingPlay = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  // Reuse one context for the session
  const w = window as unknown as { __shelterghAudio?: AudioContext };
  if (!w.__shelterghAudio) w.__shelterghAudio = new AC();
  return w.__shelterghAudio;
}

function tone(
  ctx: AudioContext,
  freq: number,
  start: number,
  duration: number,
  gainPeak: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

async function playNow() {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return;
    }
  }
  const t = ctx.currentTime;
  // Two-note "ding-ding" similar to delivery apps
  tone(ctx, 880, t, 0.18, 0.22);
  tone(ctx, 1174.7, t + 0.16, 0.28, 0.2);
}

export function unlockListingChime() {
  if (unlocked) return;
  unlocked = true;
  const ctx = getCtx();
  void ctx?.resume();
  if (pendingPlay) {
    pendingPlay = false;
    void playNow();
  }
}

export function playListingChime() {
  if (typeof window === "undefined") return;
  if (!unlocked) {
    pendingPlay = true;
    return;
  }
  void playNow();
}

/** Call once from a client root so the first tap unlocks audio. */
export function bindListingChimeUnlock() {
  if (typeof window === "undefined") return () => undefined;
  const unlock = () => unlockListingChime();
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
  return () => {
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
}
