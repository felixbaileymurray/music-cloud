/** Vanilla collage node — no music or images-specific fields. */
export type CollageItem = {
  id: string;
  imageUrl: string;
  label: string;
  weight: number;
  /**
   * Width ÷ height. Defaults to 1 (square) when omitted — music covers stay
   * square; uploaded photos carry their natural ratio.
   */
  aspectRatio?: number;
};
