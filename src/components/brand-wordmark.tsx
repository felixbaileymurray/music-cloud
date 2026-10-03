import { brand } from "@/lib/brand";

/** Mono wordmark from `/public/brand/wordmark_mono_2.svg`. */
export function BrandWordmark() {
  return (
    <img
      src="/brand/wordmark_mono_2.svg"
      alt={brand.nameSentence}
      width={150}
      height={150}
      className="mx-auto block h-auto w-full max-w-[9rem]"
    />
  );
}
