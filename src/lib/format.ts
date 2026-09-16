export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  const m = Math.floor(whole / 60);
  const s = whole % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatAlbumLength(tracks: { duration: number }[]) {
  const total = tracks.reduce((sum, track) => sum + track.duration, 0);
  if (total < 60) return `${Math.round(total)}s`;
  const minutes = Math.round(total / 60);
  return `${minutes} min`;
}
