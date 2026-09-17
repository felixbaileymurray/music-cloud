import type { ClipRef } from "@/lib/types";

const FADE_SECONDS = 0.09;

type PlaySession = {
  source: AudioBufferSourceNode;
  gain: GainNode;
};

let ctx: AudioContext | null = null;
let current: PlaySession | null = null;
let loadToken = 0;

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

export async function playSnippet(clip: ClipRef) {
  const audio = getContext();
  if (audio.state === "suspended") {
    await audio.resume();
  }

  const token = ++loadToken;
  await fadeOutAndStop();
  if (token !== loadToken) return;

  const response = await fetch(clipUrl(clip), {
    cache: clip.kind === "deezer" ? "default" : "force-cache",
  });
  if (!response.ok) return;
  const bytes = await response.arrayBuffer();
  if (token !== loadToken) return;

  const buffer = await audio.decodeAudioData(bytes.slice(0));
  if (token !== loadToken) return;

  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, audio.currentTime);
  gain.connect(audio.destination);

  const source = audio.createBufferSource();
  source.buffer = buffer;
  source.loop = false;
  source.connect(gain);
  source.start();
  gain.gain.exponentialRampToValueAtTime(1, audio.currentTime + FADE_SECONDS);

  current = { source, gain };
  source.onended = () => {
    if (current?.source === source) {
      current = null;
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
