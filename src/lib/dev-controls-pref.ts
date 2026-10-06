"use client";

import { useCallback, useSyncExternalStore } from "react";
import { APP_ID } from "@/lib/app-id";

const STORAGE_KEY = `${APP_ID}-show-dev-controls`;
const CHANGE_EVENT = `${APP_ID}-show-dev-controls-change`;

function readShowDevControls(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeShowDevControls(value: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    /* private mode / quota — preference just won't persist */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

/** Persisted preference: show the Dev Controls knobs in the sidebar. Off by default. */
export function useShowDevControls() {
  const show = useSyncExternalStore(
    subscribe,
    readShowDevControls,
    () => false,
  );

  const setShow = useCallback((value: boolean) => {
    writeShowDevControls(value);
  }, []);

  return [show, setShow] as const;
}
