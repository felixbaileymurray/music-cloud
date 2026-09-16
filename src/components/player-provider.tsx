"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import type { Album, Track } from "@/lib/types";

type PlayerContextValue = {
  album: Album | null;
  track: Track | null;
  queue: Track[];
  playing: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  error: string | null;
  playAlbum: (album: Album, tracks: Track[], startIndex?: number) => void;
  playTrack: (album: Album, tracks: Track[], track: Track) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  setVolume: (value: number) => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

const VOLUME_KEY = "music-cloud:volume";

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<Track[]>([]);
  const indexRef = useRef(0);
  const [album, setAlbum] = useState<Album | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.85);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;
    const stored = Number(localStorage.getItem(VOLUME_KEY));
    if (Number.isFinite(stored) && stored >= 0 && stored <= 1) {
      audio.volume = stored;
      setVolumeState(stored);
    } else {
      audio.volume = 0.85;
    }

    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnd = () => {
      const nextIndex = indexRef.current + 1;
      if (nextIndex < queueRef.current.length) {
        loadAt(nextIndex, true);
      } else {
        setPlaying(false);
      }
    };
    const onError = () => {
      setError("This track could not be played.");
      setPlaying(false);
      toast.error("This track could not be played.");
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("durationchange", onMeta);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("error", onError);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("durationchange", onMeta);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("error", onError);
      audioRef.current = null;
    };
  }, []);

  const loadAt = useCallback((index: number, autoplay: boolean) => {
    const audio = audioRef.current;
    const nextTrack = queueRef.current[index];
    if (!audio || !nextTrack) return;
    indexRef.current = index;
    setTrack(nextTrack);
    setError(null);
    setCurrentTime(0);
    audio.src = nextTrack.src;
    if (autoplay) {
      void audio.play().catch(() => {
        setError("Playback was blocked. Press play to start.");
        setPlaying(false);
      });
    }
  }, []);

  const playAlbum = useCallback(
    (nextAlbum: Album, tracks: Track[], startIndex = 0) => {
      if (!tracks.length) {
        toast.error("This album has no playable tracks yet.");
        return;
      }
      queueRef.current = tracks;
      setQueue(tracks);
      setAlbum(nextAlbum);
      loadAt(startIndex, true);
    },
    [loadAt]
  );

  const playTrack = useCallback(
    (nextAlbum: Album, tracks: Track[], nextTrack: Track) => {
      const index = Math.max(
        0,
        tracks.findIndex((item) => item.id === nextTrack.id)
      );
      playAlbum(nextAlbum, tracks, index);
    },
    [playAlbum]
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    if (audio.paused) {
      void audio.play().catch(() => {
        toast.error("Playback was blocked. Try pressing play again.");
      });
    } else {
      audio.pause();
    }
  }, [track]);

  const next = useCallback(() => {
    if (indexRef.current + 1 < queueRef.current.length) {
      loadAt(indexRef.current + 1, true);
    }
  }, [loadAt]);

  const prev = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    if (indexRef.current > 0) {
      loadAt(indexRef.current - 1, true);
    } else if (audio) {
      audio.currentTime = 0;
    }
  }, [loadAt]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = seconds;
    setCurrentTime(seconds);
  }, []);

  const setVolume = useCallback((value: number) => {
    const audio = audioRef.current;
    const nextVolume = Math.min(1, Math.max(0, value));
    if (audio) audio.volume = nextVolume;
    setVolumeState(nextVolume);
    localStorage.setItem(VOLUME_KEY, String(nextVolume));
  }, []);

  const value = useMemo<PlayerContextValue>(
    () => ({
      album,
      track,
      queue,
      playing,
      currentTime,
      duration,
      volume,
      error,
      playAlbum,
      playTrack,
      toggle,
      next,
      prev,
      seek,
      setVolume,
    }),
    [
      album,
      track,
      queue,
      playing,
      currentTime,
      duration,
      volume,
      error,
      playAlbum,
      playTrack,
      toggle,
      next,
      prev,
      seek,
      setVolume,
    ]
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}

export function usePlayer() {
  const value = useContext(PlayerContext);
  if (!value) {
    throw new Error("usePlayer must be used inside PlayerProvider");
  }
  return value;
}
