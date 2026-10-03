import { brand } from "@/lib/brand";

export default function Loading() {
  return (
    <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
      Loading {brand.name}
    </div>
  );
}
