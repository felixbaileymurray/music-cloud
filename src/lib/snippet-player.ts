import type { ClipRef } from "@/lib/types";

const FADE_SECONDS = 0.12;

type PlaySession = {
  source: AudioBufferSourceNode;
  gain: GainNode;
};

export type PlaySnippetOptions = {
  /** Fired when the snippet finishes naturally (not when stopped). */
  onEnded?: () => void;
};

let ctx: AudioContext | null = null;
let current: PlaySession | null = null;
let loadToken = 0;
const bufferCache = new Map<string, AudioBuffer>();

function getContext() {
  if (!ctx) {
    ctx = new AudioContext();
  }
  return ctx;
}

export async function unlockAudio() {
  const audio = getContext();
  if (audio.state === "suspended") {
    await audio.resume();
  }
  return audio.state === "running";
}

export function isAudioUnlocked() {
  return ctx?.state === "running";
}

function clipUrl(clip: ClipRef) {
  if (clip.kind === "deezer") {
    return `/api/clip?deezer=${clip.trackId}`;
  }
  return `/api/clip?u=${encodeURIComponent(clip.url)}`;
}

function clipCacheKey(clip: ClipRef) {
  return clip.kind === "deezer"
    ? `deezer:${clip.trackId}`
    : `itunes:${clip.url}`;
}

async function fetchAndDecode(audio: AudioContext, clip: ClipRef) {
  const response = await fetch(clipUrl(clip), {
    cache: clip.kind === "deezer" ? "default" : "force-cache",
  });
  if (!response.ok) return null;
  const bytes = await response.arrayBuffer();
  return audio.decodeAudioData(bytes.slice(0));
}

async function loadBuffer(audio: AudioContext, clip: ClipRef, token: number) {
  const key = clipCacheKey(clip);
  const cached = bufferCache.get(key);
  if (cached) return cached;

  const buffer = await fetchAndDecode(audio, clip);
  if (!buffer || token !== loadToken) return null;

  bufferCache.set(key, buffer);
  return buffer;
}

/** Warm the decode cache so album clip cycles transition with less silence. */
export async function prefetchSnippet(clip: ClipRef) {
  const key = clipCacheKey(clip);
  if (bufferCache.has(key)) return;
  const audio = getContext();
  try {
    const buffer = await fetchAndDecode(audio, clip);
    if (buffer && !bufferCache.has(key)) {
      bufferCache.set(key, buffer);
    }
  } catch {
    // Best-effort warm; playback will retry.
  }
}

export async function playSnippet(
  clip: ClipRef,
  options: PlaySnippetOptions = {}
) {
  const audio = getContext();
  if (audio.state === "suspended") {
    await audio.resume();
  }

  const token = ++loadToken;
  const { onEnded } = options;
  await fadeOutAndStop();
  if (token !== loadToken) return;

  const buffer = await loadBuffer(audio, clip, token);
  if (!buffer || token !== loadToken) return;

  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, audio.currentTime);
  gain.connect(audio.destination);

  const source = audio.createBufferSource();
  source.buffer = buffer;
  source.loop = false;
  source.connect(gain);
  source.start();

  const now = audio.currentTime;
  const duration = buffer.duration;
  gain.gain.exponentialRampToValueAtTime(1, now + FADE_SECONDS);
  if (duration > FADE_SECONDS * 2) {
    gain.gain.setValueAtTime(1, now + duration - FADE_SECONDS);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  }

  current = { source, gain };
  source.onended = () => {
    if (current?.source === source) {
      current = null;
    }
    if (token === loadToken) {
      onEnded?.();
    }
  };
}

export async function stopSnippet() {
  loadToken += 1;
  await fadeOutAndStop();
}

async function fadeOutAndStop() {
  const audio = ctx;
  const session = current;
  current = null;
  if (!audio || !session) return;

  const now = audio.currentTime;
  session.gain.gain.cancelScheduledValues(now);
  session.gain.gain.setValueAtTime(Math.max(session.gain.gain.value, 0.0001), now);
  session.gain.gain.exponentialRampToValueAtTime(0.0001, now + FADE_SECONDS);

  await new Promise((resolve) => window.setTimeout(resolve, FADE_SECONDS * 1000));
  try {
    session.source.stop();
  } catch {
    // Already stopped.
  }
  session.source.disconnect();
  session.gain.disconnect();
}
