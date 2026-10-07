/** Read natural width÷height for a local image object URL. Falls back to 1. */
export function readImageAspectRatio(objectUrl: string): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      resolve(w > 0 && h > 0 ? w / h : 1);
    };
    img.onerror = () => resolve(1);
    img.src = objectUrl;
  });
}
