/** Stable technical id — see `.cursor/rules/brand.mdc`. Do not change when the product is renamed. */
export const APP_ID = "collage";

/** Share URL hash prefix (token + format version). */
export const SHARE_HASH_PREFIX = "cl1=";

export function previewCacheDbName() {
  return `${APP_ID}-preview-cache`;
}

export function trackPreviewCacheDbName() {
  return `${APP_ID}-track-preview-cache`;
}
