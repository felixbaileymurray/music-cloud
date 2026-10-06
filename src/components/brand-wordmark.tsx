import { brand } from "@/lib/brand";

/** Mono horizontal wordmark from `/public/brand/wordmark_mono_horiz.svg`. */
export function BrandWordmark() {
  return (
    <img
      src="/brand/wordmark_mono_horiz.svg"
      alt={brand.nameSentence}
      width={2363}
      height={709}
      className="mx-auto block h-auto w-full"
    />
  );
}
